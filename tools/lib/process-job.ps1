param([Parameter(Mandatory=$true)][string]$Request)
$ErrorActionPreference = 'Stop'

# Create directly inside a job: no suspended-but-unassigned crash window.
# https://devblogs.microsoft.com/oldnewthing/20230209-00/?p=107812
Add-Type -TypeDefinition @"
using System;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Runtime.InteropServices;
public static class ProcessJob {
    [StructLayout(LayoutKind.Sequential)] struct BasicLimits {
        public long ProcessTime, JobTime;
        public uint Flags;
        public UIntPtr MinWorkingSet, MaxWorkingSet;
        public uint ActiveProcesses;
        public UIntPtr Affinity;
        public uint Priority, Scheduling;
    }
    [StructLayout(LayoutKind.Sequential)] struct IoCounters {
        public ulong ReadOps, WriteOps, OtherOps, ReadBytes, WriteBytes, OtherBytes;
    }
    [StructLayout(LayoutKind.Sequential)] struct ExtendedLimits {
        public BasicLimits Basic;
        public IoCounters Io;
        public UIntPtr ProcessMemory, JobMemory, PeakProcessMemory, PeakJobMemory;
    }
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] struct StartupInfo {
        public uint Size;
        public string Reserved, Desktop, Title;
        public uint X,Y,Width,Height,CharsX,CharsY,Fill,Flags;
        public ushort Show, ReservedSize;
        public IntPtr ReservedData, Input, Output, Error;
    }
    [StructLayout(LayoutKind.Sequential)] struct StartupInfoEx {
        public StartupInfo Info;
        public IntPtr Attributes;
    }
    [StructLayout(LayoutKind.Sequential)] struct ProcessInfo {
        public IntPtr Process, Thread;
        public uint ProcessId, ThreadId;
    }
    [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
    static extern IntPtr CreateJobObject(IntPtr security, string name);
    [DllImport("kernel32.dll", SetLastError=true)]
    static extern bool SetInformationJobObject(IntPtr job, int kind, ref ExtendedLimits limits, uint size);
    [DllImport("kernel32.dll", SetLastError=true)]
    static extern bool InitializeProcThreadAttributeList(IntPtr list, int count, int flags, ref IntPtr size);
    [DllImport("kernel32.dll", SetLastError=true)]
    static extern bool UpdateProcThreadAttribute(IntPtr list, uint flags, IntPtr attribute, IntPtr value, IntPtr size, IntPtr previous, IntPtr returned);
    [DllImport("kernel32.dll")] static extern void DeleteProcThreadAttributeList(IntPtr list);
    [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
    static extern bool CreateProcessW(string application, StringBuilder command, IntPtr processSecurity, IntPtr threadSecurity,
        bool inherit, uint flags, IntPtr environment, string cwd, ref StartupInfoEx startup, out ProcessInfo info);
    [DllImport("kernel32.dll", SetLastError=true)]
    static extern bool DuplicateHandle(IntPtr sourceProcess, IntPtr source, IntPtr targetProcess, out IntPtr duplicate, uint access, bool inherit, uint options);
    [DllImport("kernel32.dll")] static extern IntPtr GetCurrentProcess();
    [DllImport("kernel32.dll")] static extern IntPtr GetStdHandle(int id);
    [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
    [DllImport("kernel32.dll", SetLastError=true)] static extern uint WaitForSingleObject(IntPtr handle, uint milliseconds);
    [DllImport("kernel32.dll", SetLastError=true)] static extern bool GetExitCodeProcess(IntPtr process, out uint code);
    static void Check(bool result) { if (!result) throw new Win32Exception(Marshal.GetLastWin32Error()); }
    static string Quote(string value) {
        return "\"" + Regex.Replace(Regex.Replace(value, @"(\\*)\""", "`$1`$1\\\""), @"(\\+)`$", "`$1`$1") + "\"";
    }
    public static int Run(string command, string[] args, string cwd) {
        IntPtr job=IntPtr.Zero, attributes=IntPtr.Zero, jobValue=IntPtr.Zero, handleValues=IntPtr.Zero;
        var handles=new IntPtr[3];
        var process=new ProcessInfo();
        bool initialized=false;
        try {
            job=CreateJobObject(IntPtr.Zero,null);
            Check(job!=IntPtr.Zero);
            var limits=new ExtendedLimits();
            limits.Basic.Flags=0x2000; // KILL_ON_JOB_CLOSE, no breakaway
            Check(SetInformationJobObject(job,9,ref limits,(uint)Marshal.SizeOf(limits)));
            IntPtr size=IntPtr.Zero;
            InitializeProcThreadAttributeList(IntPtr.Zero,2,0,ref size);
            attributes=Marshal.AllocHGlobal(size);
            Check(InitializeProcThreadAttributeList(attributes,2,0,ref size));
            initialized=true;
            jobValue=Marshal.AllocHGlobal(IntPtr.Size);
            Marshal.WriteIntPtr(jobValue,job);
            Check(UpdateProcThreadAttribute(attributes,0,new IntPtr(0x2000D),jobValue,new IntPtr(IntPtr.Size),IntPtr.Zero,IntPtr.Zero));
            handleValues=Marshal.AllocHGlobal(3*IntPtr.Size);
            for(int i=0;i<3;i++) {
                Check(DuplicateHandle(GetCurrentProcess(),GetStdHandle(-10-i),GetCurrentProcess(),out handles[i],0,true,2));
                Marshal.WriteIntPtr(handleValues,i*IntPtr.Size,handles[i]);
            }
            Check(UpdateProcThreadAttribute(attributes,0,new IntPtr(0x20002),handleValues,new IntPtr(3*IntPtr.Size),IntPtr.Zero,IntPtr.Zero));
            var startup=new StartupInfoEx();
            startup.Info.Size=(uint)Marshal.SizeOf(startup);
            startup.Info.Flags=0x101; // standard handles and hidden window
            startup.Info.Input=handles[0]; startup.Info.Output=handles[1]; startup.Info.Error=handles[2];
            startup.Attributes=attributes;
            var line=new StringBuilder(string.Join(" ",new[]{command}.Concat(args).Select(Quote)));
            Check(CreateProcessW(command,line,IntPtr.Zero,IntPtr.Zero,true,0x08080000,IntPtr.Zero,cwd,ref startup,out process));
            Check(WaitForSingleObject(process.Process,0xffffffff)==0);
            uint code;
            Check(GetExitCodeProcess(process.Process,out code));
            return unchecked((int)code);
        } finally {
            // Closing the non-inherited job handle ends descendants even after their parent exited.
            if(job!=IntPtr.Zero)CloseHandle(job);
            if(process.Thread!=IntPtr.Zero)CloseHandle(process.Thread);
            if(process.Process!=IntPtr.Zero)CloseHandle(process.Process);
            foreach(var handle in handles)if(handle!=IntPtr.Zero)CloseHandle(handle);
            if(initialized)DeleteProcThreadAttributeList(attributes);
            if(attributes!=IntPtr.Zero)Marshal.FreeHGlobal(attributes);
            if(jobValue!=IntPtr.Zero)Marshal.FreeHGlobal(jobValue);
            if(handleValues!=IntPtr.Zero)Marshal.FreeHGlobal(handleValues);
        }
    }
}
"@
try {
    $inputData = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Request)) | ConvertFrom-Json
    $commandPath = (Get-Command -Name $inputData.command -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
    $code = [ProcessJob]::Run($commandPath, [string[]]$inputData.args, (Get-Location).Path)
    [Environment]::Exit($code)
} catch {
    # Per-launch marker cannot be confused with a target that merely returns exit code 125.
    [Console]::Error.WriteLine($inputData.errorMarker + 'Target launch or process supervision failed')
    [Console]::Error.WriteLine('process supervisor: ' + $_.Exception.Message)
    [Environment]::Exit(125)
}

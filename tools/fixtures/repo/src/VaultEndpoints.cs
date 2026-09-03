// A fixture, not a project. It exists so the coverage scan is exercised against something whose
// right answer is known: three routes, two of which the fixture suite covers.
//
// The MapPut below is deliberately formatted ACROSS LINES. A line-by-line scan finds the other two
// and silently misses this one, which is the shape `common/testing.md` warns about — a scan that
// stops matching passes forever. The companion test in ../../selftest.test.mjs asserts it is found.

public static class VaultEndpoints
{
    public static void MapVault(this WebApplication app)
    {
        app.MapGet("/api/vault", async (HttpContext ctx) => Results.Ok());

        app.MapPut(
            "/api/vault",
            async (HttpContext ctx) => Results.NoContent());

        app.MapDelete("/api/vault/{id}", (string id) => Results.NoContent());

        // A route mapped inside a GROUP carries only its tail. `/health` here is served at
        // `/api/admin/health`, and a scanner that compares the tail against a request's full path
        // finds nothing — which is how the mcp pilot's two routes both reported MISSING while a
        // green suite was exercising them.
        var admin = app.MapGroup("/api/admin");
        admin.MapGet("/health", () => Results.Ok());
    }
}

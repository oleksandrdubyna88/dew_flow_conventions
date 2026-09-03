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
    }
}

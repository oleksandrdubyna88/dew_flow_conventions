---
id: "common.x"
load: "conditional"
tasks: ["audit"]
depends: ["local.thing"]
---
# A shared rule depending downwards

Nothing here names a product, but the dependency runs the wrong way.

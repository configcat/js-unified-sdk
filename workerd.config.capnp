# workerd configuration for Cloudflare Worker tests

# Imports the base schema for workerd configuration files.
# See also: https://github.com/cloudflare/workerd/blob/main/src/workerd/server/workerd.capnp for more details.
using Workerd = import "/workerd/workerd.capnp";

# Defines the top-level configuration for an instance of the workerd runtime.
const configcatSdkTestConfig :Workerd.Config = (
  services = [
    (name = "main", worker = .configcatSdkTest),
    # NOTE: There are unresolvable issues with HTTPS in workerd currently, so we use a HTTP proxy running on localhost for now.
    (name = "internet", network = (allow = ["private"])),
    (name = "cache", external = "localhost:9061"), # see also: test/cloudflare-worker/test-run-helper/server.mjs
    # NOTE: The disk path must not point outside the directory where this config file resides, otherwise it won't work...
    (name = "files", disk = "test/data"),
  ],
  sockets = [(name = "http", address = "*:9050", http = (), service = "main")]
);

# The definition of the actual configcatSdkTest worker exposed using the "main" service.
const configcatSdkTest :Workerd.Worker = (
  cacheApiOutbound = "cache",
  compatibilityDate = "2023-02-28",
  modules = [
    (name = "worker", esModule = embed "test/cloudflare-worker/dist/worker.js"),
  ],
  bindings = [
    # Give the worker permission to request test data files.
    (name = "data", service = "files")
  ],
);

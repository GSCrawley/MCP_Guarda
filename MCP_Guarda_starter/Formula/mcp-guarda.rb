class McpGuarda < Formula
  desc "MCP policy proxy + consent gateway"
  homepage "https://github.com/GSCrawley/MCP_Guarda"
  # TODO: Update with release tarball and SHA256
  url "https://github.com/GSCrawley/MCP_Guarda/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "UPDATE_ME"
  license "Apache-2.0"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install "packages/guard-core/index.js" => "mcp-guarda"
  end

  test do
    assert_match "MCP Guarda", shell_output("mcp-guarda --help"), "CLI should print help"
  end
end

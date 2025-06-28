import "Kart"

/// Check current supply and remaining quantity
access(all) fun main(): {String: UInt64} {
    return {
        "maxSupply": Kart.maxSupply,
        "totalSupply": Kart.totalSupply,
        "remainingSupply": Kart.getRemainingSupply(),
        "canMint": Kart.canMint() ? 1 : 0
    }
}

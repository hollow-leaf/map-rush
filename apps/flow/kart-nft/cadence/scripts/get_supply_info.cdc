import "Kart"

/// 檢查當前供應量和剩餘數量
access(all) fun main(): {String: UInt64} {
    return {
        "maxSupply": Kart.maxSupply,
        "totalSupply": Kart.totalSupply,
        "remainingSupply": Kart.getRemainingSupply(),
        "canMint": Kart.canMint() ? 1 : 0
    }
}

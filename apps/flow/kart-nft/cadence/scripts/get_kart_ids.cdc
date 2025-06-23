import "NonFungibleToken"
import "Kart"

/// 獲取用戶收藏中的所有 Kart NFT ID 及其車速
access(all) fun main(address: Address): {UInt64: UInt8} {
    let account = getAccount(address)

    let collectionRef = account.capabilities.borrow<&{NonFungibleToken.Collection}>(
            Kart.CollectionPublicPath
    ) ?? panic("The account ".concat(address.toString()).concat(" does not have a NonFungibleToken Collection at ")
                .concat(Kart.CollectionPublicPath.toString())
                .concat(". The account must initialize their account with this collection first!"))

    let ids = collectionRef.getIDs()
    let kartData: {UInt64: UInt8} = {}

    // 我們需要借用更具體的 Collection 類型來訪問 borrowKartNFT
    if let kartCollectionRef = account.capabilities.borrow<&Kart.Collection>(Kart.CollectionPublicPath) {
        for id in ids {
            if let kartNFT = kartCollectionRef.borrowKartNFT(id: id) {
                kartData[id] = kartNFT.speed
            }
        }
    }

    return kartData
}

import "NonFungibleToken"
import "Kart"

/// Get all Kart NFT IDs, speeds, and models in user's collection
access(all) fun main(address: Address): {UInt64: {String: AnyStruct}} {
    let account = getAccount(address)

    let collectionRef = account.capabilities.borrow<&{NonFungibleToken.Collection}>(
            Kart.CollectionPublicPath
    ) ?? panic("The account ".concat(address.toString()).concat(" does not have a NonFungibleToken Collection at ")
                .concat(Kart.CollectionPublicPath.toString())
                .concat(". The account must initialize their account with this collection first!"))

    let ids = collectionRef.getIDs()
    let kartData: {UInt64: {String: AnyStruct}} = {}

    // We need to borrow the specific Collection type to access borrowKartNFT
    if let kartCollectionRef = account.capabilities.borrow<&Kart.Collection>(Kart.CollectionPublicPath) {
        for id in ids {
            if let kartNFT = kartCollectionRef.borrowKartNFT(id: id) {
                kartData[id] = {
                    "speed": kartNFT.speed,
                    "model": kartNFT.model
                }
            }
        }
    }

    return kartData
}

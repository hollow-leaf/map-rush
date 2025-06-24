import "Kart"
import "NonFungibleToken"
import "MetadataViews"

/// 獲取用戶收藏中所有 Kart NFT 的詳細信息，包括車速
access(all) fun main(address: Address): [{String: AnyStruct}] {
    let account = getAccount(address)
    
    let collectionRef = account.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(Kart.CollectionPublicPath)
        ?? panic("Could not borrow capability from collection at specified path")

    let ids = collectionRef.getIDs()
    let nftDetails: [{String: AnyStruct}] = []

    for id in ids {
        if let nft = collectionRef.borrowNFT(id) {
            if let kartNFT = nft as? &Kart.NFT {
                let nftInfo: {String: AnyStruct} = {
                    "id": kartNFT.id,
                    "speed": kartNFT.speed,
                    "rarity": kartNFT.getSpeedRarity(),
                    "rarityScore": kartNFT.getRarityScore()
                }
                
                // 獲取 Display metadata
                if let display = kartNFT.resolveView(Type<MetadataViews.Display>()) as? MetadataViews.Display {
                    nftInfo["name"] = display.name
                    nftInfo["description"] = display.description
                    nftInfo["thumbnail"] = display.thumbnail.uri()
                }
                
                // 獲取 Traits metadata
                if let traits = kartNFT.resolveView(Type<MetadataViews.Traits>()) as? MetadataViews.Traits {
                    nftInfo["traits"] = traits.traits
                }
                
                nftDetails.append(nftInfo)
            }
        }
    }

    return nftDetails
}

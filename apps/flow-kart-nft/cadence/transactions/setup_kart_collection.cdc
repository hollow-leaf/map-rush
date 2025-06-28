import "Kart"
import "NonFungibleToken"

transaction {

    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {

        // Return early if the account already has a collection
        if signer.storage.borrow<&Kart.Collection>(from: Kart.CollectionStoragePath) != nil {
            return
        }

        // Create a new empty collection
        let collection <- Kart.createEmptyCollection(nftType: Type<@Kart.NFT>())

        // save it to the account
        signer.storage.save(<-collection, to: Kart.CollectionStoragePath)

        let collectionCap = signer.capabilities.storage.issue<&Kart.Collection>(Kart.CollectionStoragePath)
        signer.capabilities.publish(collectionCap, at: Kart.CollectionPublicPath)
    }
}

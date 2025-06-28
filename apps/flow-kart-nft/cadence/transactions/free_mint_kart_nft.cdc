import "NonFungibleToken"
import "Kart"

transaction(recipient: Address) {

    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {
        // First, ensure the recipient has a collection
        let recipientAccount = getAccount(recipient)
        
        // Check if recipient already has a collection, if not create one for them
        if recipientAccount.capabilities.borrow<&Kart.Collection>(Kart.CollectionPublicPath) == nil {
            // This will only work if the recipient is the signer
            if recipient == signer.address {
                // Create a new empty collection
                let collection <- Kart.createEmptyCollection(nftType: Type<@Kart.NFT>())
                
                // save it to the account
                signer.storage.save(<-collection, to: Kart.CollectionStoragePath)
                
                let collectionCap = signer.capabilities.storage.issue<&Kart.Collection>(Kart.CollectionStoragePath)
                signer.capabilities.publish(collectionCap, at: Kart.CollectionPublicPath)
            }
        }
    }

    execute {
        // Call the free mint function from the Kart contract
        Kart.freeMint(recipient: recipient)
    }
}

import "NonFungibleToken"
import "Kart"

transaction(
    recipient: Address
) {

    /// local variable for storing the minter reference
    let minter: &Kart.NFTMinter

    /// Reference to the receiver's collection
    let recipientCollectionRef: &{NonFungibleToken.Receiver}

    prepare(signer: auth(BorrowValue) &Account) {

        // borrow a reference to the NFTMinter resource in storage
        self.minter = signer.storage.borrow<&Kart.NFTMinter>(from: Kart.MinterStoragePath)
            ?? panic("The signer does not store a Kart Collection object at the path "
                        .concat(Kart.CollectionStoragePath.toString())
                        .concat("The signer must initialize their account with this collection first!"))

        // Borrow the recipient's public NFT collection reference
        self.recipientCollectionRef = getAccount(recipient).capabilities.borrow<&{NonFungibleToken.Receiver}>(
                Kart.CollectionPublicPath
        ) ?? panic("The account ".concat(recipient.toString()).concat(" does not have a NonFungibleToken Receiver at ")
                .concat(Kart.CollectionPublicPath.toString())
                .concat(". The account must initialize their account with this collection first!"))
    }

    execute {
        // Mint the NFT and deposit it to the recipient's collection
        let mintedNFT <- self.minter.createNFT()
        self.recipientCollectionRef.deposit(token: <-mintedNFT)
    }
}

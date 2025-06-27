import NonFungibleToken from "NonFungibleToken"
import MetadataViews from "MetadataViews"

access(all) contract Kart: NonFungibleToken {

    /// Standard Paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath

    /// Path where the minter should be stored
    access(all) let MinterStoragePath: StoragePath

    /// Maximum supply limit
    access(all) let maxSupply: UInt64

    /// Current total supply
    access(all) var totalSupply: UInt64

    /// Events
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event Minted(id: UInt64)

    access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64
        /// Speed attribute (10, 8, or 5)
        access(all) let speed: UInt8
        /// Model URL based on speed
        access(all) let model: String

        init(speed: UInt8) {
            self.id = self.uuid
            self.speed = speed
            // Assign model based on speed
            self.model = self.getModelBySpeed(speed)
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-Kart.createEmptyCollection(nftType: Type<@Kart.NFT>())
        }

        /// Gets a list of views specific to the individual NFT
        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Editions>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<MetadataViews.Serial>(),
                Type<MetadataViews.Traits>()
            ]
        }

        /// Resolves a view for this specific NFT
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    let speedRarity = self.getSpeedRarity()
                    return MetadataViews.Display(
                        name: "Kart NFT #".concat(self.id.toString()),
                        description: "Racing NFT - Speed: ".concat(self.speed.toString()).concat(" (").concat(speedRarity).concat(") - Model: ").concat(self.model),
                        thumbnail: MetadataViews.HTTPFile(
                            url: "https://maplibre.org/maplibre-gl-js/docs/assets/34M_17/34M_17.gltf"
                        )
                    )
                case Type<MetadataViews.Editions>():
                    // Use maximum supply as edition limit
                    let editionInfo = MetadataViews.Edition(
                        name: "Kart Edition", 
                        number: self.id, 
                        max: Kart.maxSupply
                    )
                    let editionList: [MetadataViews.Edition] = [editionInfo]
                    return MetadataViews.Editions(
                        editionList
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(
                        self.id
                    )
                case Type<MetadataViews.Traits>():
                    return MetadataViews.Traits([
                        MetadataViews.Trait(
                            name: "Speed",
                            value: self.speed,
                            displayType: "Number",
                            rarity: MetadataViews.Rarity(
                                score: self.getRarityScore(),
                                max: 100.0,
                                description: self.getSpeedRarity()
                            )
                        ),
                        MetadataViews.Trait(
                            name: "Model",
                            value: self.model,
                            displayType: "String",
                            rarity: MetadataViews.Rarity(
                                score: self.getRarityScore(),
                                max: 100.0,
                                description: self.getSpeedRarity()
                            )
                        )
                    ])
                case Type<MetadataViews.NFTCollectionData>():
                    return Kart.resolveContractView(resourceType: Type<@Kart.NFT>(), viewType: Type<MetadataViews.NFTCollectionData>())
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return Kart.resolveContractView(resourceType: Type<@Kart.NFT>(), viewType: Type<MetadataViews.NFTCollectionDisplay>())
            }
            return nil
        }

        /// Get speed rarity description
        access(all) view fun getSpeedRarity(): String {
            switch self.speed {
                case 10:
                    return "Legendary"
                case 8:
                    return "Rare"
                case 5:
                    return "Common"
                default:
                    return "Unknown"
            }
        }

        /// Get rarity score (for MetadataViews.Rarity)
        access(all) view fun getRarityScore(): UFix64 {
            switch self.speed {
                case 10:
                    return 100.0  // 10% probability, most rare
                case 8:
                    return 70.0   // 30% probability, medium rare
                case 5:
                    return 40.0   // 60% probability, common
                default:
                    return 0.0
            }
        }

        /// Get model URL based on speed
        access(all) view fun getModelBySpeed(_ speed: UInt8): String {
            switch speed {
                case 10:
                    return "car"        // High speed - Car model
                case 8:
                    return "motorcycle" // Medium speed - Motorcycle model
                case 5:
                    return "bicycle"    // Low speed - Bicycle model
                default:
                    return "bicycle"    // Default to bicycle
            }
        }
    }

    access(all) resource Collection: NonFungibleToken.Collection {

        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init() {
            self.ownedNFTs <- {}
        }

        /// deposit takes a NFT and adds it to the collections dictionary
        /// and adds the ID to the id array
        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let token <- token as! @Kart.NFT
            let id = token.id

            // add the new token to the dictionary which removes the old one
            let oldToken <- self.ownedNFTs[token.id] <- token

            emit Deposit(id: id, to: self.owner?.address)

            destroy oldToken
        }

        /// withdraw removes an NFT from the collection and moves it to the caller
        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("Could not withdraw an NFT with the provided ID from the collection")

            emit Withdraw(id: token.id, from: self.owner?.address)

            return <-token
        }

        /// getIDs returns an array of the IDs that are in the collection
        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        /// getSupportedNFTTypes returns a list of NFT types that this receiver accepts
        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            let supportedTypes: {Type: Bool} = {}
            supportedTypes[Type<@Kart.NFT>()] = true
            return supportedTypes
        }

        /// Returns whether or not the given type is accepted by the collection
        /// A collection that can accept any type should just return true by default
        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@Kart.NFT>()
        }

        /// Allows a caller to borrow a reference to a specific NFT
        /// so that they can get the metadata views for the specific NFT
        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return (&self.ownedNFTs[id] as &{NonFungibleToken.NFT}?)
        }

        /// Borrow a specific Kart NFT reference to access speed and other attributes
        access(all) view fun borrowKartNFT(id: UInt64): &Kart.NFT? {
            if let nft = &self.ownedNFTs[id] as &{NonFungibleToken.NFT}? {
                return nft as! &Kart.NFT
            }
            return nil
        }

        /// createEmptyCollection creates an empty Collection of the same type
        /// and returns it to the caller
        /// @return A an empty collection of the same type
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <-Kart.createEmptyCollection(nftType: Type<@Kart.NFT>())
        }

    }

    /// createEmptyCollection creates an empty Collection for the specified NFT type
    /// and returns it to the caller so that they can own NFTs
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    /// Gets a list of views for all the NFTs defined by this contract
    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [
            Type<MetadataViews.NFTCollectionData>(),
            Type<MetadataViews.NFTCollectionDisplay>()
        ]
    }

    /// Get remaining mintable NFT quantity
    access(all) view fun getRemainingSupply(): UInt64 {
        return self.maxSupply - self.totalSupply
    }

    /// Check if NFTs can still be minted
    access(all) view fun canMint(): Bool {
        return self.totalSupply < self.maxSupply
    }

    /// Randomly generate speed (based on probability distribution)
    /// Speed 10: 10% probability (0-9)
    /// Speed 8:  30% probability (10-39)  
    /// Speed 5:  60% probability (40-99)
    access(all) view fun generateRandomSpeed(): UInt8 {
        // Use multiple sources for better randomness
        let blockHeight = getCurrentBlock().height
        let blockTimestamp = getCurrentBlock().timestamp
        let totalSupply = self.totalSupply
        
        // Combine multiple sources and use a more complex calculation
        let seed1 = UInt64(blockHeight) * 7919  // Large prime
        let seed2 = UInt64(blockTimestamp) * 6131  // Another large prime
        let seed3 = totalSupply * 4993  // Another large prime
        
        // Mix the seeds together
        let combinedSeed = (seed1 + seed2 + seed3) * 9973  // Final mixing with large prime
        let randomValue = combinedSeed % 100  // 0-99

        if randomValue < 10 {
            return 10  // 10% probability (rare)
        } else if randomValue < 40 {
            return 8   // 30% probability (uncommon) 
        } else {
            return 5   // 60% probability (common)
        }
    }

    /// Resolves a view that applies to all the NFTs defined by this contract
    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                let collectionData = MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&Kart.Collection>(),
                    publicLinkedType: Type<&Kart.Collection>(),
                    createEmptyCollectionFunction: (fun(): @{NonFungibleToken.Collection} {
                        return <-Kart.createEmptyCollection(nftType: Type<@Kart.NFT>())
                    })
                )
                return collectionData
            case Type<MetadataViews.NFTCollectionDisplay>():
                let media = MetadataViews.Media(
                    file: MetadataViews.HTTPFile(
                        url: "Add your own SVG+XML link here"
                    ),
                    mediaType: "image/svg+xml"
                )
                return MetadataViews.NFTCollectionDisplay(
                    name: "The Kart Example Collection",
                    description: "This collection is used as an example to help you develop your next Flow NFT.",
                    externalURL: MetadataViews.ExternalURL("Add your own link here"),
                    squareImage: media,
                    bannerImage: media,
                    socials: {
                        "twitter": MetadataViews.ExternalURL("Add a link to your project's twitter")
                    }
                )
        }
        return nil
    }

    /// Free mint function - allows anyone to mint NFTs for free
    /// @param recipient: The address that will receive the minted NFT
    access(all) fun freeMint(recipient: Address) {
        // Check if maximum supply limit is reached
        if self.totalSupply >= self.maxSupply {
            panic("Maximum supply limit reached (".concat(self.maxSupply.toString()).concat("), cannot mint more NFTs"))
        }
        
        // Get the minter reference from contract storage
        let minter = self.account.storage.borrow<&NFTMinter>(from: self.MinterStoragePath)
            ?? panic("Could not borrow minter reference from contract storage")
        
        // Mint the NFT
        let mintedNFT <- minter.createNFT()
        
        // Get the recipient's collection reference
        let recipientCollectionRef = getAccount(recipient).capabilities.borrow<&Kart.Collection>(
                self.CollectionPublicPath
        ) ?? panic("The recipient account does not have a Kart Collection at "
                    .concat(self.CollectionPublicPath.toString())
                    .concat(". The recipient must initialize their account with this collection first!"))
        
        // Deposit the NFT to the recipient's collection
        recipientCollectionRef.deposit(token: <-mintedNFT)
    }

    /// Batch free mint function - allows anyone to mint multiple NFTs for free
    /// @param recipient: The address that will receive the minted NFTs
    /// @param quantity: Number of NFTs to mint (maximum 10 per transaction)
    access(all) fun batchFreeMint(recipient: Address, quantity: UInt64) {
        // Limit batch size to prevent transaction timeout
        if quantity > 10 {
            panic("Batch mint quantity cannot exceed 10 NFTs per transaction")
        }
        
        // Check if there's enough remaining supply
        if self.totalSupply + quantity > self.maxSupply {
            panic("Batch mint quantity exceeds remaining supply. Remaining: ".concat(self.getRemainingSupply().toString()).concat(", Requested: ").concat(quantity.toString()))
        }
        
        // Get the minter reference from contract storage
        let minter = self.account.storage.borrow<&NFTMinter>(from: self.MinterStoragePath)
            ?? panic("Could not borrow minter reference from contract storage")
        
        // Get the recipient's collection reference
        let recipientCollectionRef = getAccount(recipient).capabilities.borrow<&Kart.Collection>(
                self.CollectionPublicPath
        ) ?? panic("The recipient account does not have a Kart Collection at "
                    .concat(self.CollectionPublicPath.toString())
                    .concat(". The recipient must initialize their account with this collection first!"))
        
        // Mint and deposit NFTs one by one
        var i: UInt64 = 0
        while i < quantity {
            let mintedNFT <- minter.createNFT()
            recipientCollectionRef.deposit(token: <-mintedNFT)
            i = i + 1
        }
    }

    access(all) resource NFTMinter {
        /// Mint a new NFT, checking supply limit
        access(all) fun createNFT(): @NFT {
            // Check if maximum supply limit is reached
            if Kart.totalSupply >= Kart.maxSupply {
                panic("Maximum supply limit reached (".concat(Kart.maxSupply.toString()).concat("), cannot mint more NFTs"))
            }
            
            // Generate random speed
            let speed = Kart.generateRandomSpeed()
            
            // Increase total supply
            Kart.totalSupply = Kart.totalSupply + 1
            
            let nft <- create NFT(speed: speed)
            
            emit Minted(id: nft.id)
            
            return <-nft
        }

        /// Batch mint NFTs
        access(all) fun batchCreateNFT(quantity: UInt64): @[NFT] {
            // Check if there's enough remaining supply
            if Kart.totalSupply + quantity > Kart.maxSupply {
                panic("Batch mint quantity exceeds remaining supply. Remaining: ".concat(Kart.getRemainingSupply().toString()).concat(", Requested: ").concat(quantity.toString()))
            }
            
            var nfts: @[NFT] <- []
            var i: UInt64 = 0
            
            while i < quantity {
                nfts.append(<-self.createNFT())
                i = i + 1
            }
            
            return <-nfts
        }

        init() {}
    }

    init() {
        // Set maximum supply to 10,000
        self.maxSupply = 10_000
        
        // Initialize total supply to 0
        self.totalSupply = 0
        
        // Set the named paths
        self.CollectionStoragePath = /storage/kartNFTCollection
        self.CollectionPublicPath = /public/kartNFTCollection
        self.MinterStoragePath = /storage/kartNFTMinter
        
        // Create and save the minter resource to the account storage
        self.account.storage.save(<-create NFTMinter(), to: self.MinterStoragePath)
        
        emit ContractInitialized()
    }
}
import NonFungibleToken from "NonFungibleToken"
import MetadataViews from "MetadataViews"

access(all) contract Kart: NonFungibleToken {

    /// Standard Paths
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath

    /// Path where the minter should be stored
    access(all) let MinterStoragePath: StoragePath

    /// 最大供應量上限
    access(all) let maxSupply: UInt64

    /// 當前總供應量
    access(all) var totalSupply: UInt64

    /// Events
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event Minted(id: UInt64)

    access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64

        init() {
            self.id = self.uuid
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
                Type<MetadataViews.Serial>()
            ]
        }

        /// Resolves a view for this specific NFT
        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: "Kart Example Token",
                        description: "An Example NFT Contract from the Flow NFT Guide",
                        thumbnail: MetadataViews.HTTPFile(
                            url: "Fill this in with a URL to a thumbnail of the NFT"
                        )
                    )
                case Type<MetadataViews.Editions>():
                    // 使用最大供應量作為版本上限
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
                case Type<MetadataViews.NFTCollectionData>():
                    return Kart.resolveContractView(resourceType: Type<@Kart.NFT>(), viewType: Type<MetadataViews.NFTCollectionData>())
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return Kart.resolveContractView(resourceType: Type<@Kart.NFT>(), viewType: Type<MetadataViews.NFTCollectionDisplay>())
            }
            return nil
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

    /// 獲取剩餘可鑄造的 NFT 數量
    access(all) view fun getRemainingSupply(): UInt64 {
        return self.maxSupply - self.totalSupply
    }

    /// 檢查是否還可以鑄造 NFT
    access(all) view fun canMint(): Bool {
        return self.totalSupply < self.maxSupply
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

    access(all) resource NFTMinter {
        /// 鑄造新的 NFT，檢查供應量上限
        access(all) fun createNFT(): @NFT {
            // 檢查是否達到最大供應量上限
            if Kart.totalSupply >= Kart.maxSupply {
                panic("已達到最大供應量上限 (".concat(Kart.maxSupply.toString()).concat(")，無法鑄造更多 NFT"))
            }
            
            // 增加總供應量
            Kart.totalSupply = Kart.totalSupply + 1
            
            let nft <- create NFT()
            
            emit Minted(id: nft.id)
            
            return <-nft
        }

        /// 批量鑄造 NFT
        access(all) fun batchCreateNFT(quantity: UInt64): @[NFT] {
            // 檢查是否有足夠的剩餘供應量
            if Kart.totalSupply + quantity > Kart.maxSupply {
                panic("批量鑄造數量超過剩餘供應量。剩餘: ".concat(Kart.getRemainingSupply().toString()).concat("，請求: ").concat(quantity.toString()))
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
        // 設置最大供應量為 10,000
        self.maxSupply = 10_000
        
        // 初始化總供應量為 0
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
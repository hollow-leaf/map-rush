import React from 'react';

const mockNFTData = [
  { id: '1', name: 'Kart Model A', imageUrl: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Model+A', price: '0.5 ETH' },
  { id: '2', name: 'Kart Model B', imageUrl: 'https://via.placeholder.com/150/00FF00/FFFFFF?text=Model+B', price: '0.8 ETH' },
  { id: '3', name: 'Kart Model C', imageUrl: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Model+C', price: '1.2 ETH' },
  { id: '4', name: 'Kart Model D', imageUrl: 'https://via.placeholder.com/150/FFFF00/000000?text=Model+D', price: '0.3 ETH' },
  { id: '5', name: 'Kart Model E', imageUrl: 'https://via.placeholder.com/150/FF00FF/FFFFFF?text=Model+E', price: '0.7 ETH' },
];

interface NFTCardProps {
  nft: {
    id: string;
    name: string;
    imageUrl: string;
    price: string;
  };
}

const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden m-2 flex-shrink-0 w-64">
      <img src={nft.imageUrl} alt={nft.name} className="w-full h-40 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">{nft.name}</h3>
        <p className="text-gray-700 mb-2">Price: {nft.price}</p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
          Select
        </button>
      </div>
    </div>
  );
};

const NFTMarketplace: React.FC = () => {
  return (
    <div className="my-8">
      <h2 className="text-xl font-semibold mb-4">Choose Your Kart Model</h2>
      <div className="flex overflow-x-auto pb-4">
        {mockNFTData.map(nft => (
          <NFTCard key={nft.id} nft={nft} />
        ))}
      </div>
    </div>
  );
};

export default NFTMarketplace;

import React, { useState } from 'react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">Logo</div>
        {/* Hamburger button for mobile */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
            </svg>
          </button>
        </div>
        {/* Menu for larger screens */}
        <ul className="hidden md:flex space-x-4">
          <li><a href="#" className="hover:text-gray-400">Home</a></li>
          <li><a href="#" className="hover:text-gray-400">About</a></li>
          <li><a href="#" className="hover:text-gray-400">Contact</a></li>
        </ul>
      </div>
      {/* Collapsible menu for mobile */}
      {isOpen && (
        <div className="md:hidden mt-2">
          <ul className="flex flex-col space-y-2">
            <li><a href="#" className="hover:text-gray-400 block px-2 py-1">Home</a></li>
            <li><a href="#" className="hover:text-gray-400 block px-2 py-1">About</a></li>
            <li><a href="#" className="hover:text-gray-400 block px-2 py-1">Contact</a></li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

import React from 'react';
import { SiRefinedgithub, SiBuymeacoffee, SiDiscord } from 'react-icons/si';
import './Footer.css'; // Import the CSS file for styling

const Footer = () => {
  const handleIconClick = async (url) => {
    window.open(url, '_blank');
  };

  return (
    <footer className="footer">
      <div className="icons">
        <SiRefinedgithub onClick={() => handleIconClick('https://github.com/CycloneAddons')} />
        <SiBuymeacoffee onClick={() => handleIconClick('https://www.buymeacoffee.com/cycloneaddons')} />
        <SiDiscord onClick={() => handleIconClick('https://discord.com/users/769225935153004636')} />
      </div>
      <div className="copyright">
        © 2025 Cyclone Addons. All rights reserved.
    </div></footer>
  );
};

export default Footer;
import React, { useEffect, useState } from 'react';

const ScrollButton = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const toggleVisible = () => {
            setVisible(document.documentElement.scrollTop > 300);
        };

        // Sync once in case the page is restored partway down.
        toggleVisible();

        window.addEventListener('scroll', toggleVisible, { passive: true });
        return () => window.removeEventListener('scroll', toggleVisible);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <div className='scrollButtonContainer'>
            <button id="topScrollButton" type="button" onClick={scrollToTop}
                style={{ display: visible ? 'inline' : 'none' }}>
                ^ Top of List ^
            </button>
        </div>
    );
}

export default ScrollButton;

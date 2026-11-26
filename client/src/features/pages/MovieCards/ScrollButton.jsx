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
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        window.scrollTo({
            top: 0,
            behavior: reducedMotion ? 'auto' : 'smooth'
        });
    };

    if (!visible) return null;

    return (
        <div className='scrollButtonContainer'>
            <button id="topScrollButton" type="button" onClick={scrollToTop}>
                <span aria-hidden="true">↑</span> Top
            </button>
        </div>
    );
}

export default ScrollButton;

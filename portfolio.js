// === GLOBAL CONFIGURATION ===
const MARGIN_PERCENT = 0.03;        // 3% margin from screen edges
const TITLE_PADDING = 15;          // 15px gap around title
const SIDE_LABEL_PADDING = 10;     // 15px gap around side label
const ANIMATION_DURATION = 800;    // 800ms animation length
const MIN_MARGIN_X = 30;           // Minimum 30px from sides
const MIN_MARGIN_Y = 30;           // Minimum 30px from top/bottom
const TITLE_LEFT_POSITION = 50;
const CORNER_GAP = 20;  // 20px gap at each corner
const SIDE_LABEL_RIGHT = 5;

// Timing delays for animation sequence
const FADE_IN_DELAY = 500;         // When box fades in
const EXPAND_DELAY = 1500;         // When box expands
const TITLE_DELAY = 2300;          // When title appears

// Store base positions for pulsing animation
let basePositions = {};
// Store split positions independently (always label-gap values, never merged)
let splitBasePositions = {};
// Incremented on every resize so the initial animation can't overwrite newer positions
let positionVersion = 0;
// All active Three.js carousels on the projects page (one per project card)
let carouselInstances = [];

// === POSITION FUNCTIONS ===
function setInitialBox() {
    const svg = document.querySelector('svg');
    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;
    
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const boxSize = Math.min(svgWidth, svgHeight) * 0.25;
    const half = boxSize / 2;
    
    document.getElementById('top-left').setAttribute('x1', centerX - half);
    document.getElementById('top-left').setAttribute('y1', centerY - half);
    document.getElementById('top-left').setAttribute('x2', centerX + half);
    document.getElementById('top-left').setAttribute('y2', centerY - half);
    
    document.getElementById('top-right').setAttribute('x1', centerX);
    document.getElementById('top-right').setAttribute('y1', centerY);
    document.getElementById('top-right').setAttribute('x2', centerX);
    document.getElementById('top-right').setAttribute('y2', centerY);
    
    document.getElementById('right-top').setAttribute('x1', centerX + half);
    document.getElementById('right-top').setAttribute('y1', centerY - half);
    document.getElementById('right-top').setAttribute('x2', centerX + half);
    document.getElementById('right-top').setAttribute('y2', centerY);
    
    document.getElementById('right-bottom').setAttribute('x1', centerX + half);
    document.getElementById('right-bottom').setAttribute('y1', centerY);
    document.getElementById('right-bottom').setAttribute('x2', centerX + half);
    document.getElementById('right-bottom').setAttribute('y2', centerY + half);
    
    document.getElementById('bottom').setAttribute('x1', centerX + half);
    document.getElementById('bottom').setAttribute('y1', centerY + half);
    document.getElementById('bottom').setAttribute('x2', centerX - half);
    document.getElementById('bottom').setAttribute('y2', centerY + half);
    
    document.getElementById('left').setAttribute('x1', centerX - half);
    document.getElementById('left').setAttribute('y1', centerY + half);
    document.getElementById('left').setAttribute('x2', centerX - half);
    document.getElementById('left').setAttribute('y2', centerY - half);
}

function setContentArea() {
    const svg = document.querySelector('svg');
    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;
    
    const percentMarginX = svgWidth * MARGIN_PERCENT;
    const percentMarginY = svgHeight * MARGIN_PERCENT;
    
    const marginX = Math.max(percentMarginX, MIN_MARGIN_X);
    const marginY = Math.max(percentMarginY, MIN_MARGIN_Y);
    
    const contentArea = document.querySelector('.content-area');
    const padding = 20;
    const inset = padding;
    
    // Pin with left/right/top/bottom so the box always stays inside the viewport
    // (avoids overflow when clientWidth/innerWidth disagree, scrollbars, etc.)
    contentArea.style.left = `${marginX + inset}px`;
    contentArea.style.right = `${marginX + inset}px`;
    contentArea.style.top = `${marginY + inset}px`;
    contentArea.style.bottom = `${marginY + inset}px`;
    contentArea.style.width = 'auto';
    contentArea.style.height = 'auto';
}

function setFinalPosition() {
    positionVersion++; // Invalidate any in-progress initial animation
    const title = document.querySelector('.title');
    const svg = document.querySelector('svg');
    
    if (!title || !svg) return;
    
    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;
    
    // Calculate percentage margins
    const percentMarginX = svgWidth * MARGIN_PERCENT;
    const percentMarginY = svgHeight * MARGIN_PERCENT;
    
    // Use the larger of percentage or minimum
    const leftEdge = Math.max(percentMarginX, MIN_MARGIN_X);
    const rightEdge = svgWidth - Math.max(percentMarginX, MIN_MARGIN_X);
    const topEdge = Math.max(percentMarginY, MIN_MARGIN_Y);
    const bottomEdge = svgHeight - Math.max(percentMarginY, MIN_MARGIN_Y);
    
    // Position title to align with top line
    const titleRect = title.getBoundingClientRect();
    const titleHeight = titleRect.height;
    const titleTop = topEdge - (titleHeight / 2);
    const titleLeft = leftEdge + TITLE_LEFT_POSITION;
    
    title.style.top = `${titleTop}px`;
    title.style.left = `${titleLeft}px`;
    
    // Get updated title position after moving it
    const titleRectUpdated = title.getBoundingClientRect();
    
   // Top left segment: left edge to before title (with corner gap)
    document.getElementById('top-left').setAttribute('x1', leftEdge + CORNER_GAP);
    document.getElementById('top-left').setAttribute('y1', topEdge);
    document.getElementById('top-left').setAttribute('x2', titleRectUpdated.left - TITLE_PADDING);
    document.getElementById('top-left').setAttribute('y2', topEdge);

    // Top right segment: after title to right edge (with corner gap)
    document.getElementById('top-right').setAttribute('x1', titleRectUpdated.right + TITLE_PADDING);
    document.getElementById('top-right').setAttribute('y1', topEdge);
    document.getElementById('top-right').setAttribute('x2', rightEdge - CORNER_GAP);
    document.getElementById('top-right').setAttribute('y2', topEdge);

    // Position side label at 88% mark, right-aligned to page edge
    const sideLabel = document.querySelector('.side-label');
    const rightLineHeight = bottomEdge - topEdge;
    const sideLabelY = topEdge + (rightLineHeight * 0.88);
    const sideLabelRect = sideLabel.getBoundingClientRect();
    const sideLabelHeight = sideLabelRect.height;
    const sideLabelWidth = sideLabelRect.width;
    const sideLabelTop = sideLabelY - (sideLabelHeight / 2);
    
    
    sideLabel.style.top = `${sideLabelTop}px`;
    sideLabel.style.right = `${SIDE_LABEL_RIGHT}px`;
    
    // Get updated side label position
    const sideLabelRectUpdated = sideLabel.getBoundingClientRect();
    
    // Right-top and right-bottom: position depends on route
    const isHome = getCurrentRoute() === 'home';
    
    document.getElementById('right-top').setAttribute('x1', rightEdge);
    document.getElementById('right-top').setAttribute('y1', topEdge + CORNER_GAP);
    document.getElementById('right-top').setAttribute('x2', rightEdge);
    document.getElementById('right-top').setAttribute('y2', isHome ? bottomEdge - CORNER_GAP : sideLabelRectUpdated.top - SIDE_LABEL_PADDING);
    
    document.getElementById('right-bottom').setAttribute('x1', rightEdge);
    document.getElementById('right-bottom').setAttribute('y1', isHome ? bottomEdge - CORNER_GAP : sideLabelRectUpdated.bottom + SIDE_LABEL_PADDING);
    document.getElementById('right-bottom').setAttribute('x2', rightEdge);
    document.getElementById('right-bottom').setAttribute('y2', bottomEdge - CORNER_GAP);

    // Bottom line (with corner gaps both sides)
    document.getElementById('bottom').setAttribute('x1', rightEdge - CORNER_GAP);
    document.getElementById('bottom').setAttribute('y1', bottomEdge);
    document.getElementById('bottom').setAttribute('x2', leftEdge + CORNER_GAP);
    document.getElementById('bottom').setAttribute('y2', bottomEdge);

    // Left line (with corner gaps top and bottom)
    document.getElementById('left').setAttribute('x1', leftEdge);
    document.getElementById('left').setAttribute('y1', bottomEdge - CORNER_GAP);
    document.getElementById('left').setAttribute('x2', leftEdge);
    document.getElementById('left').setAttribute('y2', topEdge + CORNER_GAP);
    
    // Store base positions for pulsing animation
    // Store base positions for pulsing animation
    basePositions = {
        // Top-left line endpoints
        topLeftX1: leftEdge + CORNER_GAP,
        topLeftY1: topEdge,
        topLeftX2: titleRectUpdated.left - TITLE_PADDING,
        topLeftY2: topEdge,
        
        // Top-right line endpoints
        topRightX1: titleRectUpdated.right + TITLE_PADDING,
        topRightY1: topEdge,
        topRightX2: rightEdge - CORNER_GAP,
        topRightY2: topEdge,
        
        // Right-top line endpoints
        rightTopX1: rightEdge,
        rightTopY1: topEdge + CORNER_GAP,
        rightTopX2: rightEdge,
        rightTopY2: isHome ? bottomEdge - CORNER_GAP : sideLabelRectUpdated.top - SIDE_LABEL_PADDING,
        
        // Right-bottom line endpoints
        rightBottomX1: rightEdge,
        rightBottomY1: isHome ? bottomEdge - CORNER_GAP : sideLabelRectUpdated.bottom + SIDE_LABEL_PADDING,
        rightBottomX2: rightEdge,
        rightBottomY2: bottomEdge - CORNER_GAP,
        
        // Always store split values (used when restoring from merged state)
        splitRightTopY2: sideLabelRectUpdated.top - SIDE_LABEL_PADDING,
        splitRightBottomY1: sideLabelRectUpdated.bottom + SIDE_LABEL_PADDING,
        
        // Bottom line endpoints
        bottomX1: rightEdge - CORNER_GAP,
        bottomY1: bottomEdge,
        bottomX2: leftEdge + CORNER_GAP,
        bottomY2: bottomEdge,
        
        // Left line endpoints
        leftX1: leftEdge,
        leftY1: bottomEdge - CORNER_GAP,
        leftX2: leftEdge,
        leftY2: topEdge + CORNER_GAP
    };
    
    setContentArea();
}

function animateToFinalPosition() {
    const myVersion = positionVersion; // Snapshot version; resize will increment past this
    const title = document.querySelector('.title');
    const svg = document.querySelector('svg');
    
    if (!title || !svg) return;
    
    const svgWidth = svg.clientWidth;
    const svgHeight = svg.clientHeight;
    
    // Calculate percentage margins
    const percentMarginX = svgWidth * MARGIN_PERCENT;
    const percentMarginY = svgHeight * MARGIN_PERCENT;
    
    // Use the larger of percentage or minimum
    const leftEdge = Math.max(percentMarginX, MIN_MARGIN_X);
    const rightEdge = svgWidth - Math.max(percentMarginX, MIN_MARGIN_X);
    const topEdge = Math.max(percentMarginY, MIN_MARGIN_Y);
    const bottomEdge = svgHeight - Math.max(percentMarginY, MIN_MARGIN_Y);
    
    // Position title to align with top line
    const titleRect = title.getBoundingClientRect();
    const titleHeight = titleRect.height;
    const titleTop = topEdge - (titleHeight / 2);
    const titleLeft = leftEdge + TITLE_LEFT_POSITION;
    
    title.style.top = `${titleTop}px`;
    title.style.left = `${titleLeft}px`;
    
    // Get updated title position
    const titleRectUpdated = title.getBoundingClientRect();
    
    // Position side label at 88% mark, right-aligned to page edge
    const sideLabel = document.querySelector('.side-label');
    const rightLineHeight = bottomEdge - topEdge;
    const sideLabelY = topEdge + (rightLineHeight * 0.88);
    const sideLabelRect = sideLabel.getBoundingClientRect();
    const sideLabelHeight = sideLabelRect.height;
    const sideLabelTop = sideLabelY - (sideLabelHeight / 2);

    sideLabel.style.top = `${sideLabelTop}px`;
    sideLabel.style.left = '';
    sideLabel.style.right = `${SIDE_LABEL_RIGHT}px`;
    
    // Get updated side label position
    const sideLabelRectUpdated = sideLabel.getBoundingClientRect();
    
    // Get current positions for animation
    const lines = {
        topLeft: {
            id: 'top-left',
            from: {
                x1: parseFloat(document.getElementById('top-left').getAttribute('x1')),
                y1: parseFloat(document.getElementById('top-left').getAttribute('y1')),
                x2: parseFloat(document.getElementById('top-left').getAttribute('x2')),
                y2: parseFloat(document.getElementById('top-left').getAttribute('y2'))
            },
            to: { x1: leftEdge + CORNER_GAP, y1: topEdge, x2: titleRectUpdated.left - TITLE_PADDING, y2: topEdge }
        },
        topRight: {
            id: 'top-right',
            from: {
                x1: parseFloat(document.getElementById('top-right').getAttribute('x1')),
                y1: parseFloat(document.getElementById('top-right').getAttribute('y1')),
                x2: parseFloat(document.getElementById('top-right').getAttribute('x2')),
                y2: parseFloat(document.getElementById('top-right').getAttribute('y2'))
            },
            to: { x1: titleRectUpdated.right + TITLE_PADDING, y1: topEdge, x2: rightEdge - CORNER_GAP, y2: topEdge }
        },
        rightTop: {
            id: 'right-top',
            from: {
                x1: parseFloat(document.getElementById('right-top').getAttribute('x1')),
                y1: parseFloat(document.getElementById('right-top').getAttribute('y1')),
                x2: parseFloat(document.getElementById('right-top').getAttribute('x2')),
                y2: parseFloat(document.getElementById('right-top').getAttribute('y2'))
            },
            to: { x1: rightEdge, y1: topEdge + CORNER_GAP, x2: rightEdge, y2: getCurrentRoute() === 'home' ? bottomEdge - CORNER_GAP : sideLabelRectUpdated.top - SIDE_LABEL_PADDING }
        },
        rightBottom: {
            id: 'right-bottom',
            from: {
                x1: parseFloat(document.getElementById('right-bottom').getAttribute('x1')),
                y1: parseFloat(document.getElementById('right-bottom').getAttribute('y1')),
                x2: parseFloat(document.getElementById('right-bottom').getAttribute('x2')),
                y2: parseFloat(document.getElementById('right-bottom').getAttribute('y2'))
            },
            to: { x1: rightEdge, y1: getCurrentRoute() === 'home' ? bottomEdge - CORNER_GAP : sideLabelRectUpdated.bottom + SIDE_LABEL_PADDING, x2: rightEdge, y2: bottomEdge - CORNER_GAP }
        },
        bottom: {
            id: 'bottom',
            from: {
                x1: parseFloat(document.getElementById('bottom').getAttribute('x1')),
                y1: parseFloat(document.getElementById('bottom').getAttribute('y1')),
                x2: parseFloat(document.getElementById('bottom').getAttribute('x2')),
                y2: parseFloat(document.getElementById('bottom').getAttribute('y2'))
            },
            to: { x1: rightEdge - CORNER_GAP, y1: bottomEdge, x2: leftEdge + CORNER_GAP, y2: bottomEdge }
        },
        left: {
            id: 'left',
            from: {
                x1: parseFloat(document.getElementById('left').getAttribute('x1')),
                y1: parseFloat(document.getElementById('left').getAttribute('y1')),
                x2: parseFloat(document.getElementById('left').getAttribute('x2')),
                y2: parseFloat(document.getElementById('left').getAttribute('y2'))
            },
            to: { x1: leftEdge, y1: bottomEdge - CORNER_GAP, x2: leftEdge, y2: topEdge + CORNER_GAP }
        }
    };
    
    // Animate
    const duration = ANIMATION_DURATION;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);
        
        Object.values(lines).forEach(lineData => {
            const line = document.getElementById(lineData.id);
            const { from, to } = lineData;
            
            line.setAttribute('x1', from.x1 + (to.x1 - from.x1) * eased);
            line.setAttribute('y1', from.y1 + (to.y1 - from.y1) * eased);
            line.setAttribute('x2', from.x2 + (to.x2 - from.x2) * eased);
            line.setAttribute('y2', from.y2 + (to.y2 - from.y2) * eased);
        });
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Only write basePositions if no resize has fired since this animation started
            if (positionVersion !== myVersion) return;
            basePositions = {
                // Top-left line endpoints
                topLeftX1: lines.topLeft.to.x1,
                topLeftY1: lines.topLeft.to.y1,
                topLeftX2: lines.topLeft.to.x2,
                topLeftY2: lines.topLeft.to.y2,
                
                // Top-right line endpoints
                topRightX1: lines.topRight.to.x1,
                topRightY1: lines.topRight.to.y1,
                topRightX2: lines.topRight.to.x2,
                topRightY2: lines.topRight.to.y2,
                
                // Right-top line endpoints
                rightTopX1: lines.rightTop.to.x1,
                rightTopY1: lines.rightTop.to.y1,
                rightTopX2: lines.rightTop.to.x2,
                rightTopY2: lines.rightTop.to.y2,
                
                // Right-bottom line endpoints
                rightBottomX1: lines.rightBottom.to.x1,
                rightBottomY1: lines.rightBottom.to.y1,
                rightBottomX2: lines.rightBottom.to.x2,
                rightBottomY2: lines.rightBottom.to.y2,
                
                // Always store split values (used when restoring from merged state)
                splitRightTopY2: sideLabelRectUpdated.top - SIDE_LABEL_PADDING,
                splitRightBottomY1: sideLabelRectUpdated.bottom + SIDE_LABEL_PADDING,
                
                // Bottom line endpoints
                bottomX1: lines.bottom.to.x1,
                bottomY1: lines.bottom.to.y1,
                bottomX2: lines.bottom.to.x2,
                bottomY2: lines.bottom.to.y2,
                
                // Left line endpoints
                leftX1: lines.left.to.x1,
                leftY1: lines.left.to.y1,
                leftX2: lines.left.to.x2,
                leftY2: lines.left.to.y2
            };
            
            setContentArea();
        }
    }
    
    requestAnimationFrame(animate);
}

// === ANIMATION SEQUENCE ===
function animateIn() {
    const svg = document.querySelector('svg');
    const title = document.querySelector('.title');
    const sideLabel = document.querySelector('.side-label');
    
    setInitialBox();
    
    setTimeout(() => {
        svg.classList.add('initial');
    }, FADE_IN_DELAY);
    
    setTimeout(() => {
        animateToFinalPosition();
        svg.classList.add('expanded');
    }, EXPAND_DELAY);
    
    setTimeout(() => {
        title.classList.add('visible');
        document.querySelector('.content-area').classList.add('visible');
        // sideLabel visibility is handled by routing
    }, TITLE_DELAY);
}

// === INITIALIZE ===
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', animateIn);
} else {
    animateIn();
}

// Always allow resize and update base positions
window.addEventListener('resize', function() {
    setFinalPosition();
    updateSideLabel();
});

// === PULSING ANIMATION ===
function startPulsing() {
    const startTime = performance.now();
    let lastFrame = 0;
    
    function pulse(currentTime) {
        // 30fps for performance
        if (currentTime - lastFrame < 32) {
            requestAnimationFrame(pulse);
            return;
        }
        lastFrame = currentTime;
        
        const time = (currentTime - startTime) * 0.001;
        
        // Create 10 different oscillations (one for each endpoint)
        const osc1 = (
            Math.sin(time * .2) * 12 +
            Math.sin(time * .9) * 7 +
            Math.sin(time * 0.5) * 3
        );
        
        const osc2 = (
            Math.sin(time * 0.12 + 1) * 4 +     // Much slower (0.12 vs 0.175), smaller distance (4 vs 8)
            Math.sin(time * 0.8) * 1 +          // Slower (0.8 vs 1.15), smaller (1 vs 3)
            Math.sin(time * 0.03) * 1           // Much slower (0.03 vs 0.045), smaller (1 vs 2)
        );
        
        const osc3 = (
            Math.sin(time * 0.5) * 7 +
            Math.sin(time * 1.6 + 2) * 2 +
            Math.sin(time * 0.14) * 3
        );
        
        const osc4 = (
            Math.sin(time * 0.3 + 2) * 10 +
            Math.sin(time * 2.5) * 3 +
            Math.sin(time * 0.08) * 2
        );
        
        const osc5 = (
            Math.sin(time * 0.45) * 6 +
            Math.sin(time * 1.9 + 1) * 2 +
            Math.sin(time * 0.12) * 3
        );
        
        const osc6 = (
            Math.sin(time * 0.38 + 3) * 8 +
            Math.sin(time * 2.2) * 2 +
            Math.sin(time * 0.1) * 3
        );
        
        const osc7 = (
            Math.sin(time * 0.42) * 9 +
            Math.sin(time * 1.7 + 1.5) * 3 +
            Math.sin(time * 0.15) * 2
        );
        
        const osc8 = (
            Math.sin(time * 0.48) * 7 +
            Math.sin(time * 2.0) * 2 +
            Math.sin(time * 0.13) * 3
        );
        
        const osc9 = (
            Math.sin(time * 0.36 + 2.5) * 8 +
            Math.sin(time * 1.85) * 2 +
            Math.sin(time * 0.11) * 2
        );
        
        const osc10 = (
            Math.sin(time * 0.44 + 0.5) * 7 +
            Math.sin(time * 2.4) * 3 +
            Math.sin(time * 0.09) * 3
        );
        
        const osc11 = (
            Math.sin(time * 0.52) * 8 +
            Math.sin(time * 1.95) * 2 +
            Math.sin(time * 0.12) * 2
        );
        
        const osc12 = (
            Math.sin(time * 0.39 + 1.8) * 9 +
            Math.sin(time * 2.1) * 2 +
            Math.sin(time * 0.11) * 3
        );
        
        // Top-left line: both endpoints move
        const topLeft = document.getElementById('top-left');
        topLeft.setAttribute('x1', basePositions.topLeftX1 + osc1);  // Left endpoint
        topLeft.setAttribute('x2', basePositions.topLeftX2 + osc2);  // Right endpoint (near title)
        
        // Top-right line: both endpoints move
        const topRight = document.getElementById('top-right');
        topRight.setAttribute('x1', basePositions.topRightX1 - osc3);  // Left endpoint (near title)
        topRight.setAttribute('x2', basePositions.topRightX2 - osc4);  // Right endpoint
        
        // Right-top line: only top endpoint pulses
        const rightTop = document.getElementById('right-top');
        rightTop.setAttribute('y1', basePositions.rightTopY1 + osc5);
        const rightTopY2Pulsed = basePositions.rightTopY2 + osc6;
        // On non-home routes clamp so the line never crosses into the side label gap
        rightTop.setAttribute('y2', getCurrentRoute() !== 'home'
            ? Math.min(rightTopY2Pulsed, basePositions.splitRightTopY2)
            : rightTopY2Pulsed);
        
        // Right-bottom line
        const rightBottom = document.getElementById('right-bottom');
        if (getCurrentRoute() === 'home') {
            // On home: locked to right-top's bottom (merged, no gap)
            rightBottom.setAttribute('y1', basePositions.rightTopY2);
        } else {
            // On other pages: clamp to splitRightBottomY1 so line never enters the label
            const pulsedY1 = basePositions.rightBottomY1 - osc12;
            rightBottom.setAttribute('y1', Math.max(pulsedY1, basePositions.splitRightBottomY1));
        }
        rightBottom.setAttribute('y2', basePositions.rightBottomY2 + osc6);
        
        // Bottom line: both endpoints move
        const bottom = document.getElementById('bottom');
        bottom.setAttribute('x1', basePositions.bottomX1 - osc7);  // Right endpoint
        bottom.setAttribute('x2', basePositions.bottomX2 + osc8);  // Left endpoint
        
        // Left line: both endpoints move
        const left = document.getElementById('left');
        left.setAttribute('y1', basePositions.leftY1 - osc9);  // Bottom endpoint
        left.setAttribute('y2', basePositions.leftY2 + osc10); // Top endpoint
        
        requestAnimationFrame(pulse);
    }
    
    requestAnimationFrame(pulse);
}


setTimeout(startPulsing, TITLE_DELAY + 1000);  // Start 1 sec after title appears

// === PAGE ROUTING ===

const PAGE_CONFIG = {
    'home': {
        sideLabel: null,
        details: null,
        showLabel: false
    },
    'about': {
        sideLabel: 'About Me',
        details: null,
        showLabel: true
    },
    'projects': {
        sideLabel: 'Projects',
        details: 'Previews',
        showLabel: true
    },
    'projects/7tvote': {
        sideLabel: 'Projects',
        details: '7tvote',
        showLabel: true
    },
    'projects/rafflebot': {
        sideLabel: 'Projects',
        details: 'RaffleBot',
        showLabel: true
    }
    ,
    'contact': {
        sideLabel: 'Contact',
        details: null,
        showLabel: true
    }
};

function getCurrentRoute() {
    const hash = window.location.hash.slice(1);
    return hash || 'home';
}

function updateSideLabel() {
    const route = getCurrentRoute();
    const config = PAGE_CONFIG[route];
    
    if (!config) return;
    
    const mainLabel = document.getElementById('main-label');
    const secondaryLabel = document.getElementById('secondary-label');
    const sideLabel = document.querySelector('.side-label');
    
    
    if (config.showLabel) {
        // Show label and split line
        mainLabel.textContent = config.sideLabel;
        secondaryLabel.textContent = config.details;
        sideLabel.classList.add('visible');
        
        // Restore split positions (always correct regardless of which page loaded first)
        basePositions.rightTopY2 = basePositions.splitRightTopY2;
        basePositions.rightBottomY1 = basePositions.splitRightBottomY1;
        
    } else {
        // Hide label and merge lines
        sideLabel.classList.remove('visible');
        mainLabel.textContent = '';
        secondaryLabel.textContent = '';
        
        // UPDATE base positions to merged position
        basePositions.rightTopY2 = basePositions.rightBottomY2;
    }
    requestAnimationFrame(function () {
        setFinalPosition();
    });
}

// Initialize route state BEFORE animations start
function initializeRoute() {
    const route = getCurrentRoute();
    const config = PAGE_CONFIG[route];
    if (!config) return; // sub-routes like #projects/foo aren't in PAGE_CONFIG
    const mainLabel = document.getElementById('main-label');
    const secondaryLabel = document.getElementById('secondary-label');
    
    // Set initial text content (hidden by CSS)
    if (config.showLabel) {
        mainLabel.textContent = config.sideLabel;
        secondaryLabel.textContent = config.details;

    } else {
        mainLabel.textContent = '';
        secondaryLabel.textContent = '';
    }


}

// Call BEFORE animation starts
// Don't initialize route on DOMContentLoaded - let animations run first
// Initialize routing AFTER animations complete
setTimeout(function() {
    initializeRoute();
    updateSideLabel();
    updateContent();
}, TITLE_DELAY + 100);  // Slight buffer after title to ensure basePositions is set

window.addEventListener('hashchange', function() {
    updateSideLabel();
    updateContent();

});

function updateContent() {
    disposeCarousel(); // stop any active Three.js render loop before replacing DOM
    const route = getCurrentRoute();
    const contentArea = document.querySelector('.content-area');
    
    if (route === 'home') {
        contentArea.id = '';
        contentArea.innerHTML = `
            <nav class="main-nav">
                <a href="#about">About</a>
                <a href="#projects">Projects</a>
                <a href="#contact">Contact</a>
            </nav>
        `;
    } else if (route === 'about') {
        contentArea.id = '';
        contentArea.innerHTML = `
            <div class="about-div" id="summary-div">
                <h1>Summary</h1>
                <p>
                    A graduate of CSU Fullerton in Southern California, with a Bachelor Degree in Computer Science. 
                    With experience in data annotation, AI response quality review, and coding tasks from my contract work, 
                    and web development experience from my time volunteering with NeuroNur Research Initiative, I am looking 
                    to step into a more permanent, fulltime role to learn and work alongside a team of like-minded developers. 
                    Through personal projects and the above mentioned experience, I have basic competency around the stack, 
                    with an emphasis on backend. Using Python for backend and Javascript for frontend, I make web applications 
                    for mainly personal or peer use, automating and shortening tasks that I do frequently that I felt could 
                    be shortened.
                </p>
            </div>
            <div class="about-div" id="education-div">
                <h1>Education</h1>
                <section class="individual-experience-section">
                    <section class="about-experience-subtitle">
                        <section class="about-experience-left">
                            <h3 class="experience-title">B.S. Computer Science</h3>
                            <h4 class="experience-company"> ● CSU Fullerton </h4>
                        </section>
                        <h4 class="experience-years">Graduated 2025</h4>
                    </section>
                </section>
                
            </div>
            <div class="about-div" id="experience-div">
                <h1>Experience</h1>
                
                <section class="individual-experience-section">
                    <section class="about-experience-subtitle">
                        <section class="about-experience-left">
                            <h3 class="experience-title">Web Developer </h3>
                            <h4 class="experience-company"> ● NeuroNur </h4>
                        </section>
                        <h4 class="experience-years">2025-Present</h4>
                    </section>
                    <ul>
                        <li>Deployed NeuroNur’s official website to expand online presence, share the group's current research project results, and attract contributors/collaborators (hunter-hues.github.io/NeuroNur)</li>
                        <li>Collaborated with founding members, researchers, and the outreach members to translate goals into technical requirements, plan features, implement them in JavaScript, receive feedback, and continue refining the site</li>
                    </ul>
                </section>
                
                <section class="individual-experience-section">
                    <section class="about-experience-subtitle">
                        <section class="about-experience-left">
                            <h3 class="experience-title">Developer </h3>
                            <h4 class="experience-company"> ● DataAnnotation </h4>
                        </section>
                        <h4 class="experience-years">2025-Present</h4>
                    </section>
                    <ul>
                        <li>Tested coding models, providing them with tasks, rating the logic, and correcting their output as needed</li>
                        <li>Solved given problems or replicated small features with code(mainly Python and Javascript, with occaional HTML/CSS), and documented logic to serve as training data</li>
                    </ul>
                </section>

                <section class="individual-experience-section">  
                    <section class="about-experience-subtitle">
                        <section class="about-experience-left">
                            <h3 class="experience-title">AI Annotator </h3>
                            <h4 class="experience-company"> ● DataAnnotation </h4>
                        </section>
                        <h4 class="experience-years">2023-2025</h4>
                    </section>
                    <ul>
                        <li>Validated collegiate-level math reasoning datasets, enhancing AI model accuracy and response quality</li>
                        <li>Performed quality checks and code reviews on peer-completed tasks, ensuring consistency with project standards</li>
                    </ul>
                </section>
            </div>
        `;
    } else if (route === 'projects') {
        contentArea.id = '';
        contentArea.innerHTML = `
            <section>
                <div id="projects-list">
                    <div class="project-card">
                        <div class="carousel-column">
                            <div id="7tvote-link" class="preview-carousel"></div>
                        </div>
                        <div class="project-text">
                            <a href="#projects/7tvote"><h3>7tvote</h3></a>
                            <p class="preview-description">7tvote is a web application intended to be an official extension/tool for 7tv users. It allows them to create 
                                voting events for their(or other channels they are authorized for) emote sets, to get either community sentiment,
                                or to easier gather mod/streamer opinions to better know which emotes to remove from their 7tv library(as it has 
                                a 1000 emote limit).
                            </p>
                                
                            <p class="preview-languages">
                                Python, Javascript, HTML, CSS, SQL, FastAPI, GraphQL, Twitch Oauth, PostgreSQL
                            </p>
                        </div>
                    </div>

                    <div class="project-card">
                        <div class="carousel-column">
                            <div id="rafflebot-link" class="preview-carousel"></div>
                        </div>
                        <div class="project-text">
                            <a href="#projects/rafflebot"><h3>RaffleBot</h3></a>
                            <p class="preview-description" >RaffleBot is a tool, initially intended specifically for a specific streamer's Christmas giveaway event, however it became a tool that 
                                can be used by any streamer for similiar events. It changed a task that required a team of 8 working in rotating shifts over 30 hours, into 
                                a task that only required 1 person for however long the event lasts. It handles event creation, item storage, distribution, and event monitoring, 
                                allowing for much simpler and effecient giveaway events, both for the streamer/owner, and their community/recipients as well.
                            </p>

                            <p class="preview-languages">
                                Python, HTML, CSS, SQL, Flask, TwitchIO, Twitch Oauth, PostgreSQL
                            </p>
                        </div>
                    </div>

                </div>
                <aside id="projects-sidebar">

                </aside>
                <div id="projects-details">

                </div>
            </section>
        `;
        const seventtvoteImages = ['images/7tvote_preview1.png', 'images/7tvote_preview2.png'];
        const seventtvoteSection = document.getElementById('7tvote-link');
        createCarousel(seventtvoteImages, seventtvoteSection, 'preview');

        const rafflebotImages = ['images/RaffleBot_preview1.png', 'images/RaffleBot_preview2.png'];
        const rafflebotSection = document.getElementById('rafflebot-link');
        createCarousel(rafflebotImages, rafflebotSection, 'preview');
    } else if (route === 'projects/7tvote'){
        contentArea.id = 'seventvote';
        contentArea.innerHTML = `
        <div id="seventvote-images" class="images-details"></div>
        <section class="detail-project">
            <section class="languages-links-details">
                <div id="seventvote-languages" class="detail-languages">
                <h3>Project Components</h3>
                <p>Python, Javascript, HTML, CSS, SQL</p>
                <h6>FastAPI, GraphQL, Twitch Oauth, PostgreSQL</h6>
                </div>

                <div id="seventvote-links" class="detail-links">
                <h3>Website: <a href="https://www.7tvote.dev" target="_blank" rel="noopener noreferrer">7tvote.dev</a></h3>
                <h3>Github: <a href="https://github.com/hunter-hues/7tv-Voting" target="_blank" rel="noopener noreferrer">Github Repo</a></h3>
                </div>
            </section>
            <div id="seventvote-summary" class="detail-summary">
            <h3>Summary</h3>
            <p>7tvote is a web application intended to be an official extension/tool for 7tv users. It allows them to create 
            voting events for their(or other channels they are authorized for) emote sets, to get either community sentiment,
            or to easier gather mod/streamer opinions to better know which emotes to remove from their 7tv library(as it has 
            a 1000 emote limit).
            <br>
            <ul>
            <li>It uses the FastAPI Python library for its backend, handling event creation and editing, user creation, making 
            requests to Twitch(Helix) and 7tv(GraphQL) to gather needed user and emote information, handle OAuth using Twitch, user authorization 
            for events, features, information, etc, and the calculation of data needed by the front end for event summaries.</li>
            <li>Javascript is used to display information handed to the front end, using API endpoints to send information back 
            to the backend, as well as control pagnation, carry out permission based displaying of data, create clear visual 
            indications of emote or event statuses, </li>
            </ul>
            </p>
            </div>

            

        </section>
        `;
        const seventtvoteImages = ['images/7tvote_preview1.png', 'images/7tvote_preview2.png'];
        const seventtvoteSection = document.getElementById('seventvote-images');
        createCarousel(seventtvoteImages, seventtvoteSection, 'detail');

    } else if (route === 'projects/rafflebot'){
        contentArea.id = 'rafflebot';
        contentArea.innerHTML = `
        <div id="rafflebot-images" class="images-details"></div>
        <section class="detail-project">

            <div id="rafflebot-summary" class="detail-summary">
            <h3>Summary</h3>
            <p>RaffleBot is a tool, initially intended specifically for a specific streamer's Christmas giveaway event, however it became a tool that 
            can be used by any streamer for similiar events. It changed a task that required a team of 8 working in rotating shifts over 30 hours, into 
            a task that only required 1 person for however long the event lasts. It handles event creation, item storage, distribution, and event monitoring, 
            allowing for much simpler and effecient giveaway events, both for the streamer/owner, and their community/recipients as well.</p>
            <ul>
            <li>It uses the Flask Python library for routing and back end tasks, handling user authorization through Twitch's Oauth, creating events, editing those 
            events, managing giveaway items, using TwitchIO to integrate real time Twitch chat information for events, and distributing the items to winners, 
            using their Twitch account as verification tool in order to ensure security.</li>
            <li>A static HTML front end handles displaying event, item and user status, ensuring as up to date information as possible.</li>
            </ul>
            </div>

            <section class="languages-links-details">
                <div id="rafflebot-languages" class="detail-languages">
                <h3>Languages</h3>
                <h5>Python, HTML, CSS, SQL</h5>
                <h6>Flask, TwitchIO, Twitch Oauth, PostgreSQL</h6>
                </div>

                <div id="rafflebot-links" class="detail-links">
                <h3>Website: <a href="https://rafflebot-site.onrender.com/" target="_blank" rel="noopener noreferrer">Rafflebot Site</a></h3>
                <h3>Github: <a href="https://github.com/hunter-hues/RaffleBot" target="_blank" rel="noopener noreferrer">Github Repo</a></h3>
                </div>
            </section>
        </section>
        `;
        const seventtvoteImages = ['images/RaffleBot_preview1.png', 'images/RaffleBot_preview2.png'];
        const seventtvoteSection = document.getElementById('rafflebot-images');
        createCarousel(seventtvoteImages, seventtvoteSection, 'detail');

    } else if (route === 'contact') {
        const EMAILJS_PUBLIC_KEY = 'Q4xjtELSUhXxf30kr';
        const EMAILJS_SERVICE_ID = 'service_tp4awvt';
        const EMAILJS_TEMPLATE_ID = 'template_d2j6196';
        contentArea.id = 'contact-content-area';
         contentArea.innerHTML = `
            <div class='contact-div'>
                <div class="contact-socials">
                    <a class="social-link" target="blank" href="https://www.linkedin.com/in/hunter-jon-hughes/" style="text-decoration: none; color: black;">
                        <img class="social-link-image" src="images/linkedin.png">
                        <p class="social-link-text"></p>
                    </a>
                    <a class="social-link" target="blank" href="https://mail.google.com/mail/?view=cm&fs=1&to=hunter.j.hues@gmail.com" style="text-decoration: none; color: black;">
                        <img class="social-link-image" src="images/email.png">
                        <p class="social-link-text"></p>
                    </a>
                </div>

                <h1 class="contact-or"> OR </h1>

                <form id="contact-form">
                    <fieldset class="name-fieldset">
                        <legend>Name</legend>
                        <input class="input" type="text" name="name" placeholder="..." required />
                    </fieldset>

                    <fieldset class="email-fieldset">
                        <legend>Email</legend>
                        <input class="input" type="email" name="email" placeholder="..." required />
                    </fieldset>

                    <fieldset class="message-fieldset">
                        <legend>Message</legend>
                        <textarea name="message" rows="6" placeholder="…" required></textarea>
                    </fieldset>
                    <button class="contact-button" type="submit">Send</button>
                </form>

            </div>
        `;
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

        const form = document.getElementById('contact-form');
        if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            if (btn) btn.disabled = true;

            emailjs
            .sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
            .then(function () {
                alert('Sent.');
                form.reset();
            })
            .catch(function (err) {
                console.error(err);
                alert('Send failed.');
            })
            .finally(function () {
                if (btn) btn.disabled = false;
            });
        });
        }
    } 

}

// === CAROUSEL CLEANUP ===

function disposeCarousel() {
    carouselInstances.forEach(function (instance) {
        instance.dispose();
    });
    carouselInstances = [];
}

// === THREE.JS CAROUSEL CLASSES (ported from Szenia Zadvornykh's CodePen) ===

function CarouselSlide(width, height, animationPhase) {
    var plane = new THREE.PlaneGeometry(width, height, Math.ceil(width * 2), Math.ceil(height * 2));
    THREE.BAS.Utils.separateFaces(plane);

    var geometry = new CarouselSlideGeometry(plane);
    geometry.bufferUVs();

    var aAnimation     = geometry.createAttribute('aAnimation', 2);
    var aStartPosition = geometry.createAttribute('aStartPosition', 3);
    var aControl0      = geometry.createAttribute('aControl0', 3);
    var aControl1      = geometry.createAttribute('aControl1', 3);
    var aEndPosition   = geometry.createAttribute('aEndPosition', 3);

    var i, i2, i3, v;
    var minDuration = 0.8, maxDuration = 1.2;
    var maxDelayX = 0.9, maxDelayY = 0.125, stretch = 0.11;
    this.totalDuration = maxDuration + maxDelayX + maxDelayY + stretch;

    var startPosition = new THREE.Vector3();
    var control0      = new THREE.Vector3();
    var control1      = new THREE.Vector3();
    var endPosition   = new THREE.Vector3();
    var tempPoint     = new THREE.Vector3();

    function getControlPoint0(centroid) {
        var signY = Math.sign(centroid.y);
        tempPoint.x = THREE.Math.randFloat(0.1, 0.3) * 50;
        tempPoint.y = signY * THREE.Math.randFloat(0.1, 0.3) * 70;
        tempPoint.z = THREE.Math.randFloatSpread(20);
        return tempPoint;
    }

    function getControlPoint1(centroid) {
        var signY = Math.sign(centroid.y);
        tempPoint.x = THREE.Math.randFloat(0.3, 0.6) * 50;
        tempPoint.y = -signY * THREE.Math.randFloat(0.3, 0.6) * 70;
        tempPoint.z = THREE.Math.randFloatSpread(20);
        return tempPoint;
    }

    for (i = 0, i2 = 0, i3 = 0; i < geometry.faceCount; i++, i2 += 6, i3 += 9) {
        var face     = plane.faces[i];
        var centroid = THREE.BAS.Utils.computeCentroid(plane, face);

        var duration = THREE.Math.randFloat(minDuration, maxDuration);
        var delayX   = THREE.Math.mapLinear(centroid.x, -width * 0.5, width * 0.5, 0.0, maxDelayX);
        var delayY   = animationPhase === 'in'
            ? THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, 0.0, maxDelayY)
            : THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, maxDelayY, 0.0);

        for (v = 0; v < 6; v += 2) {
            aAnimation.array[i2 + v]     = delayX + delayY + (Math.random() * stretch * duration);
            aAnimation.array[i2 + v + 1] = duration;
        }

        endPosition.copy(centroid);
        startPosition.copy(centroid);

        if (animationPhase === 'in') {
            control0.copy(centroid).sub(getControlPoint0(centroid));
            control1.copy(centroid).sub(getControlPoint1(centroid));
        } else {
            control0.copy(centroid).add(getControlPoint0(centroid));
            control1.copy(centroid).add(getControlPoint1(centroid));
        }

        for (v = 0; v < 9; v += 3) {
            aStartPosition.array[i3 + v]     = startPosition.x;
            aStartPosition.array[i3 + v + 1] = startPosition.y;
            aStartPosition.array[i3 + v + 2] = startPosition.z;
            aControl0.array[i3 + v]          = control0.x;
            aControl0.array[i3 + v + 1]      = control0.y;
            aControl0.array[i3 + v + 2]      = control0.z;
            aControl1.array[i3 + v]          = control1.x;
            aControl1.array[i3 + v + 1]      = control1.y;
            aControl1.array[i3 + v + 2]      = control1.z;
            aEndPosition.array[i3 + v]       = endPosition.x;
            aEndPosition.array[i3 + v + 1]   = endPosition.y;
            aEndPosition.array[i3 + v + 2]   = endPosition.z;
        }
    }

    var material = new THREE.BAS.BasicAnimationMaterial(
        {
            shading: THREE.FlatShading,
            side: THREE.DoubleSide,
            uniforms: { uTime: { type: 'f', value: 0 } },
            shaderFunctions: [
                THREE.BAS.ShaderChunk['cubic_bezier'],
                THREE.BAS.ShaderChunk['ease_in_out_cubic'],
                THREE.BAS.ShaderChunk['quaternion_rotation']
            ],
            shaderParameters: [
                'uniform float uTime;',
                'attribute vec2 aAnimation;',
                'attribute vec3 aStartPosition;',
                'attribute vec3 aControl0;',
                'attribute vec3 aControl1;',
                'attribute vec3 aEndPosition;'
            ],
            shaderVertexInit: [
                'float tDelay = aAnimation.x;',
                'float tDuration = aAnimation.y;',
                'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
                'float tProgress = ease(tTime, 0.0, 1.0, tDuration);'
            ],
            shaderTransformPosition: [
                (animationPhase === 'in' ? 'transformed *= tProgress;' : 'transformed *= 1.0 - tProgress;'),
                'transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);'
            ]
        },
        { map: new THREE.Texture() }
    );

    THREE.Mesh.call(this, geometry, material);
    this.frustumCulled = false;
}

CarouselSlide.prototype = Object.create(THREE.Mesh.prototype);
CarouselSlide.prototype.constructor = CarouselSlide;

Object.defineProperty(CarouselSlide.prototype, 'time', {
    get: function() { return this.material.uniforms['uTime'].value; },
    set: function(v) { this.material.uniforms['uTime'].value = v; }
});

CarouselSlide.prototype.setImage = function(image) {
    var texture = this.material.uniforms.map.value;
    texture.image = image;
    texture.minFilter = THREE.LinearFilter;      // required for non-power-of-two images in r75
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
};

CarouselSlide.prototype.transition = function() {
    return TweenMax.fromTo(this, 3.0, { time: 0.0 }, { time: this.totalDuration, ease: Power0.easeInOut });
};

function CarouselSlideGeometry(model) {
    THREE.BAS.ModelBufferGeometry.call(this, model);
}

CarouselSlideGeometry.prototype = Object.create(THREE.BAS.ModelBufferGeometry.prototype);
CarouselSlideGeometry.prototype.constructor = CarouselSlideGeometry;

CarouselSlideGeometry.prototype.bufferPositions = function() {
    var positionBuffer = this.createAttribute('position', 3).array;
    for (var i = 0; i < this.faceCount; i++) {
        var face     = this.modelGeometry.faces[i];
        var centroid = THREE.BAS.Utils.computeCentroid(this.modelGeometry, face);
        var a = this.modelGeometry.vertices[face.a];
        var b = this.modelGeometry.vertices[face.b];
        var c = this.modelGeometry.vertices[face.c];

        positionBuffer[face.a * 3]     = a.x - centroid.x;
        positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
        positionBuffer[face.a * 3 + 2] = a.z - centroid.z;
        positionBuffer[face.b * 3]     = b.x - centroid.x;
        positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
        positionBuffer[face.b * 3 + 2] = b.z - centroid.z;
        positionBuffer[face.c * 3]     = c.x - centroid.x;
        positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
        positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
    }
};

// === CAROUSEL FACTORY ===

function createCarousel(imgs, parentElement, sizeType) {
    if (!imgs || imgs.length === 0) return;

    /* CarouselSlide plane 100×60 — height fallback if layout not ready yet */
    const slideAspect = 100 / 60;

    let currentIndex = 0;
    let isTransitioning = false;

    // Three.js render target
    const threeDiv = document.createElement('div');
    threeDiv.className = 'carousel-three-div';
    if (sizeType === 'detail') parentElement.classList.add('detail-carousel');

    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.textContent = '←';
    prevButton.className = 'carousel-btn carousel-btn-prev';
    prevButton.setAttribute('aria-label', 'Previous image');

    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.textContent = '→';
    nextButton.className = 'carousel-btn carousel-btn-next';
    nextButton.setAttribute('aria-label', 'Next image');

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'carousel-controls';
    controlsDiv.appendChild(prevButton);
    controlsDiv.appendChild(nextButton);

    parentElement.appendChild(threeDiv);
    parentElement.appendChild(controlsDiv);

    const fov = 65, cameraZ = 76;

    const renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio === 1, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);
    threeDiv.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(fov, 1, 1, 10000);
    camera.position.set(0, 0, cameraZ);

    const carouselColumn = parentElement && parentElement.parentElement;
    const projectCard = carouselColumn && carouselColumn.parentElement;

    /** Insets describe the letterboxed image inside the WebGL canvas; host + card (for list .project-text) */
    function applyImageInsetVars(leftPx, topPx, bottomPx) {
        const L = `${leftPx}px`;
        const T = `${topPx}px`;
        const B = `${bottomPx}px`;
        parentElement.style.setProperty('--img-inset-left', L);
        parentElement.style.setProperty('--img-inset-top', T);
        parentElement.style.setProperty('--img-inset-bottom', B);
        if (projectCard && projectCard.classList && projectCard.classList.contains('project-card')) {
            projectCard.style.setProperty('--img-inset-left', L);
            projectCard.style.setProperty('--img-inset-top', T);
            projectCard.style.setProperty('--img-inset-bottom', B);
        }
    }

    function syncRendererSize() {
        let w = threeDiv.clientWidth;
        let h = threeDiv.clientHeight;
        if (carouselColumn) {
            const colW = Math.floor(carouselColumn.getBoundingClientRect().width);
            if (colW > 0) {
                w = w > 0 ? Math.min(w, colW) : colW;
            }
        } else if (!w && parentElement) {
            const pw = Math.floor(parentElement.getBoundingClientRect().width);
            if (pw > 0) w = pw;
        }
        if (!w || w < 1) {
            const again = carouselColumn
                ? Math.floor(carouselColumn.getBoundingClientRect().width)
                : 0;
            w = again > 0 ? again : 300;
        }
        w = Math.max(1, Math.floor(w));
        h = Math.max(1, Math.floor(h || Math.round(w * slideAspect)));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);

        // Expose the rendered image's left/top inset so CSS can align controls/text
        // with the image itself as the canvas and camera framing change.
        const distance = Math.abs(camera.position.z);
        const fovRad = THREE.Math.degToRad(camera.fov);
        const visibleWorldHeight = 2 * Math.tan(fovRad / 2) * distance;
        const pxPerUnit = h / visibleWorldHeight;
        const planeW = 100; // must match CarouselSlide width
        const planeH = 60;  // must match CarouselSlide height
        const imagePxW = planeW * pxPerUnit;
        const imagePxH = planeH * pxPerUnit;
        const insetLeft = Math.max(0, (w - imagePxW) / 2);
        const insetTop = Math.max(0, (h - imagePxH) / 2);
        const insetBottom = Math.max(0, h - imagePxH - insetTop);
        applyImageInsetVars(insetLeft, insetTop, insetBottom);
    }

    syncRendererSize();
    requestAnimationFrame(syncRendererSize);

    const resizeObserver = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(syncRendererSize)
        : null;
    /* Observe the flex column so grid/track width changes always resize the canvas (threeDiv alone can miss updates) */
    if (resizeObserver) resizeObserver.observe(carouselColumn || threeDiv);

    const scene = new THREE.Scene();

    // Two slides (100×60 Three.js units, matching the original CodePen proportions)
    const slideOut = new CarouselSlide(100, 60, 'out');
    const slideIn  = new CarouselSlide(100, 60, 'in');
    scene.add(slideOut);
    scene.add(slideIn);

    // Preload all images; set first image on slideOut as soon as it's ready
    const loadedImages = new Array(imgs.length).fill(null);
    imgs.forEach(function(url, i) {
        new THREE.ImageLoader().load(url, function(image) {
            loadedImages[i] = image;
            if (i === 0) slideOut.setImage(image);
        });
    });

    // Render loop — stops when disposed
    let disposed = false;
    function tick() {
        if (disposed) return;
        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    carouselInstances.push({
        dispose: function() {
            disposed = true;
            if (resizeObserver) resizeObserver.disconnect();
            renderer.dispose();
        }
    });

    // Run the transition to a new index
    function doTransition(newIndex) {
        if (isTransitioning) return;
        const newImage = loadedImages[newIndex];
        if (!newImage) return; // image not preloaded yet

        isTransitioning = true;
        slideIn.setImage(newImage);
        slideOut.time = 0;
        slideIn.time  = 0;

        var tl = new TimelineMax({
            onComplete: function() {
                // Transfer: slideOut takes the new image so it's ready for the next click
                slideOut.setImage(newImage);
                slideOut.time = 0; // visible at rest
                slideIn.time  = 0; // invisible (phase 'in', tProgress=0 → scaled to 0)
                currentIndex = newIndex;
                isTransitioning = false;
            }
        });
        tl.add(slideOut.transition(), 0);
        tl.add(slideIn.transition(), 0);
    }

    prevButton.addEventListener('click', function() {
        doTransition((currentIndex - 1 + imgs.length) % imgs.length);
    });

    nextButton.addEventListener('click', function() {
        doTransition((currentIndex + 1) % imgs.length);
    });

    if (imgs.length <= 1) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
    }
}
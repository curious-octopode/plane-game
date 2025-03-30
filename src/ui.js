export class UI {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.left = '0';
        this.container.style.bottom = '0';
        this.container.style.width = '100%';
        this.container.style.padding = '20px';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.color = 'white';
        this.container.style.textShadow = '2px 2px 2px rgba(0,0,0,0.5)';
        document.body.appendChild(this.container);

        this.createControlsPanel();
        this.createSpeedIndicator();
    }

    createControlsPanel() {
        const controls = document.createElement('div');
        controls.style.position = 'absolute';
        controls.style.left = '20px';
        controls.style.bottom = '20px';
        controls.style.backgroundColor = 'rgba(0,0,0,0.5)';
        controls.style.padding = '15px';
        controls.style.borderRadius = '5px';
        controls.innerHTML = `
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">Controls</h3>
            <div style="font-size: 14px; line-height: 1.5;">
                <div>W/S: Pitch control</div>
                <div>A/D: Roll control</div>
                <div>Q/E: Speed control</div>
                <div>C: Toggle camera mode</div>
            </div>
        `;
        this.container.appendChild(controls);
    }

    createSpeedIndicator() {
        const speedContainer = document.createElement('div');
        speedContainer.style.position = 'absolute';
        speedContainer.style.right = '20px';
        speedContainer.style.bottom = '20px';
        speedContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
        speedContainer.style.padding = '15px';
        speedContainer.style.borderRadius = '5px';
        speedContainer.style.minWidth = '120px';
        
        this.speedValue = document.createElement('div');
        this.speedValue.style.fontSize = '24px';
        this.speedValue.style.marginBottom = '5px';
        this.speedValue.style.textAlign = 'center';
        
        this.speedBar = document.createElement('div');
        this.speedBar.style.width = '100%';
        this.speedBar.style.height = '10px';
        this.speedBar.style.backgroundColor = 'rgba(255,255,255,0.2)';
        this.speedBar.style.borderRadius = '5px';
        this.speedBar.style.overflow = 'hidden';
        
        this.speedFill = document.createElement('div');
        this.speedFill.style.width = '50%';
        this.speedFill.style.height = '100%';
        this.speedFill.style.backgroundColor = '#4CAF50';
        this.speedFill.style.transition = 'width 0.2s, background-color 0.2s';
        
        this.speedBar.appendChild(this.speedFill);
        speedContainer.appendChild(this.speedValue);
        speedContainer.appendChild(this.speedBar);
        this.container.appendChild(speedContainer);
    }

    updateSpeed(speed, normalizedSpeed) {
        this.speedValue.textContent = `${Math.round(speed)} km/h`;
        this.speedFill.style.width = `${normalizedSpeed * 100}%`;
        
        // Color coding based on speed
        let color;
        if (normalizedSpeed < 0.3) color = '#f44336'; // Red for low speed
        else if (normalizedSpeed > 0.7) color = '#2196F3'; // Blue for high speed
        else color = '#4CAF50'; // Green for medium speed
        
        this.speedFill.style.backgroundColor = color;
    }
} 
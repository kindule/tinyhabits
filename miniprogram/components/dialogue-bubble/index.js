Component({
    properties: {
        character: {
            type: String,
            value: 'arc', // 'arc' | 'mia' | 'rift'
        },
        text: {
            type: String,
            value: ''
        },
        animate: {
            type: Boolean,
            value: true
        }
    },

    data: {
        showAnimation: false
    },

    lifetimes: {
        attached() {
            if (this.properties.animate) {
                setTimeout(() => {
                    this.setData({ showAnimation: true });
                }, 50);
            } else {
                this.setData({ showAnimation: true });
            }
        }
    }
});

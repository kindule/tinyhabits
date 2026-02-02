Component({
    properties: {
        selected: {
            type: Boolean,
            value: false
        },
        disabled: {
            type: Boolean,
            value: false
        }
    },

    methods: {
        onTap() {
            if (!this.properties.disabled) {
                this.triggerEvent('tap');
            }
        }
    }
});

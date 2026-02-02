Component({
    properties: {
        text: {
            type: String,
            value: ''
        },
        disabled: {
            type: Boolean,
            value: false
        },
        loading: {
            type: Boolean,
            value: false
        }
    },

    data: {
        shimmer: false
    },

    methods: {
        onTap() {
            if (!this.properties.disabled && !this.properties.loading) {
                this.setData({ shimmer: true });
                setTimeout(() => this.setData({ shimmer: false }), 200);
                this.triggerEvent('tap');
            }
        }
    }
});

Component({
    properties: {
        text: { type: String, value: '' },
        selected: { type: Boolean, value: false },
        delay: { type: Number, value: 0 }
    },

    data: {
        visible: false
    },

    lifetimes: {
        attached() {
            setTimeout(() => {
                this.setData({ visible: true });
            }, this.properties.delay);
        }
    },

    methods: {
        onTap() {
            this.triggerEvent('tap');
        }
    }
});

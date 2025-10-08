import { createStore } from 'vuex';
import module from './modules/module';

// Create store
export default createStore({
    modules: {
        module
    }
});

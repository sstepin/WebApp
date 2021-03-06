import Dispatcher from '../dispatcher/AppDispatcher';

export default {
  setHeadroomUnpinned (unpinned) {
    Dispatcher.dispatch({ type: 'headroomUnpinned', payload: unpinned });
  },

  setShowSelectBallotModal (show) {
    Dispatcher.dispatch({ type: 'showSelectBallotModal', payload: show });
  },

  setShowEditAddressButton (show) {
    Dispatcher.dispatch({ type: 'showEditAddressButton', payload: show });
  },
  setScrolled (scrolledDown) {
    Dispatcher.dispatch({ type: 'scrolledDown', payload: scrolledDown });
  },
};

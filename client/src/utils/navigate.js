// navigation.js
let navigateFn;

export const setNavigate = (navFn) => {
  navigateFn = navFn;
};

export const navigate = (...args) => {
  if (navigateFn) {
    navigateFn(...args);
  } else {
    console.warn("Navigate function not set yet");
  }
};

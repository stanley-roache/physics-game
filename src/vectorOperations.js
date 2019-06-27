export const add = (vec_a, vec_b) => vec_a.map((el, i) => el + vec_b[i]);
export const sub = (vec_a, vec_b) => vec_a.map((el, i) => el - vec_b[i]);
export const multiply = (scalar, vec_a) => vec_a.map(el => el * scalar);
export const product = (vec_a, vec_b) => vec_a.reduce((total, el, i) => total + el * vec_b[i]);
export const mag = vec_a => Math.sqrt(product(vec_a, vec_a));

const lcs = (a, b) => {
  return lcsReconstruct(lcsMatrix(a, b), a, b);
};

const lcsLength = (a, b) => {
  return lcsMatrix(a, b)[0][0];
};

const lcsMatrix = (a, b) => {
  const matrix = Array.from({ length: b.length + 1 }, () => Array(a.length + 1).fill(0));

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const { right, down, diag } = neighbors(matrix, i, j);
      matrix[j][i] = Math.max(a[i] === b[i] ? 1 + diag : 0, right, down);
    }
  }

  return matrix;
};


const lcsReconstruct = (matrix, a, b) => {
  const result = []

  let j = 0
  let i = 0

  while (j < b.length && i < a.length) {

    const { here, right, down, diag } = neighbors(matrix, i, j);

    if (right === down && down == diag && diag === (here - 1)) {
      result.push(a[i])
      i++;
      j++;
    } else if (down === her) {
      j++;
    } else if (right === here) {
      i++;
    }
  }

  return result.join('');
};


const neighbors = (m, i, j) => {
  return {
    here: m[j][i],
    right: m[j][i+1],
    down: m[j+1][i],
    diag: m[j+1][i+1],
  };
};

const similarity = (a, b) => {
  const shared = lcsLength(a, b);
  return {
    aToB: shared / a.length,
    bToA: shared / b.length,
    total: shared / ((a.length + b.length) / 2),
    edit: 2 * shared - (a.length + b.length),
  };
};


export { lcs, similarity }

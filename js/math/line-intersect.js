  // intersection :: Line -> Line -> Either String (Float, Float)
const intersection = (ab, pq) => {
  const
      delta = f => x => f(fst(x)) - f(snd(x)),
      [abDX, pqDX, abDY, pqDY] = apList(
          [delta(fst), delta(snd)], [ab, pq]
      ),
      determinant = abDX * pqDY - abDY * pqDX;

  return determinant !== 0 ? Right((() => {
      const [abD, pqD] = map(
          ([a, b]) => fst(a) * snd(b) - fst(b) * snd(a),
          [ab, pq]
      );
      return apList(
          [([pq, ab]) =>
              (abD * pq - ab * pqD) / determinant
          ], [
              [pqDX, abDX],
              [pqDY, abDY]
          ]
      );
  })()) : Left('(Parallel lines – no intersection)');
};

// GENERIC FUNCTIONS ------------------------------------------------------

// Left :: a -> Either a b
const Left = x => ({
    type: 'Either',
    Left: x
});

// Right :: b -> Either a b
const Right = x => ({
    type: 'Either',
    Right: x
});

// A list of functions applied to a list of arguments
// <*> :: [(a -> b)] -> [a] -> [b]
const apList = (fs, xs) => //
    [].concat.apply([], fs.map(f => //
        [].concat.apply([], xs.map(x => [f(x)]))));

// fst :: (a, b) -> a
const fst = tpl => tpl[0];

// map :: (a -> b) -> [a] -> [b]
const map = (f, xs) => xs.map(f);

// snd :: (a, b) -> b
const snd = tpl => tpl[1];

// show :: a -> String
const show = x => JSON.stringify(x); //, null, 2);

module.exports = intersection
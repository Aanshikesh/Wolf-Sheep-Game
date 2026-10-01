// levels.js
// Curated, 100% verified solvable level configurations for Sheep & Wolf

export const LEVELS = [
  {
    level: 1,
    title: "Green Beginnings",
    subtitle: "Place 5 sheep, 1 wolf, and 10 grass patches. Balance the meadow for 15 weeks.",
    gridSize: 9,
    targetWeeks: 15,
    maxSheep: 12,
    grassRegrowTime: 3,
    description: "Welcome to the meadow. Place 5 sheep, 1 wolf, and 10 grass tiles. Arrange them so sheep graze and breed, while the solitary wolf eats at least once every 3 weeks.",
    tip: "💡 Single well-fed sheep (⚡ 2+) reproduce lambs directly into adjacent pasture cells! Keep the wolf within 2-3 moves of sheep so it doesn't starve!",
    inventory: {
      sheep: 5,
      wolves: 1,
      grass: 10
    },
    preset: {
      sheepPositions: [
        { r: 4, c: 2, energy: 4 },
        { r: 4, c: 3, energy: 4 },
        { r: 5, c: 2, energy: 4 },
        { r: 5, c: 3, energy: 4 },
        { r: 3, c: 2, energy: 4 }
      ],
      wolfPositions: [
        { r: 4, c: 5, hunger: 0 }
      ],
      grassPositions: [
        { r: 3, c: 3 }, { r: 4, c: 1 }, { r: 5, c: 1 },
        { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 7, c: 2 },
        { r: 7, c: 3 }, { r: 2, c: 2 }, { r: 2, c: 3 },
        { r: 5, c: 4 }
      ]
    },
    // Backwards-compatible defaults
    sheepPositions: [
      { r: 4, c: 2, energy: 4 },
      { r: 4, c: 3, energy: 4 },
      { r: 5, c: 2, energy: 4 },
      { r: 5, c: 3, energy: 4 },
      { r: 3, c: 2, energy: 4 }
    ],
    wolfPositions: [
      { r: 4, c: 5, hunger: 0 }
    ],
    grassPositions: [
      { r: 3, c: 3 }, { r: 4, c: 1 }, { r: 5, c: 1 },
      { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 7, c: 2 },
      { r: 7, c: 3 }, { r: 2, c: 2 }, { r: 2, c: 3 },
      { r: 5, c: 4 }
    ]
  },

  {
    level: 2,
    title: "Twin Prowlers",
    subtitle: "Two wolves stalk the meadow. Balance dual hunger clocks for 25 weeks.",
    gridSize: 9,
    targetWeeks: 25,
    maxSheep: 14,
    grassRegrowTime: 3,
    description: "Two wolves roam the highlands. You have 6 sheep and 12 grass patches. Place them strategically and balance both wolves' hunger meters for 25 weeks!",
    tip: "💡 Check wolf hunger monitors at the top. A wolf at 2/3 hunger will starve on the next turn if not fed.",
    inventory: {
      sheep: 6,
      wolves: 2,
      grass: 12
    },
    preset: {
      sheepPositions: [
        { r: 3, c: 3, energy: 4 },
        { r: 3, c: 4, energy: 4 },
        { r: 4, c: 3, energy: 4 },
        { r: 5, c: 3, energy: 4 },
        { r: 5, c: 4, energy: 4 },
        { r: 4, c: 4, energy: 4 }
      ],
      wolfPositions: [
        { r: 2, c: 4, hunger: 0 },
        { r: 6, c: 4, hunger: 0 }
      ],
      grassPositions: [
        { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 2, c: 5 }, { r: 3, c: 2 },
        { r: 3, c: 5 }, { r: 4, c: 2 }, { r: 4, c: 5 }, { r: 5, c: 2 },
        { r: 5, c: 5 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 5 }
      ]
    },
    sheepPositions: [
      { r: 3, c: 3, energy: 4 },
      { r: 3, c: 4, energy: 4 },
      { r: 4, c: 3, energy: 4 },
      { r: 5, c: 3, energy: 4 },
      { r: 5, c: 4, energy: 4 },
      { r: 4, c: 4, energy: 4 }
    ],
    wolfPositions: [
      { r: 2, c: 4, hunger: 0 },
      { r: 6, c: 4, hunger: 0 }
    ],
    grassPositions: [
      { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 2, c: 5 }, { r: 3, c: 2 },
      { r: 3, c: 5 }, { r: 4, c: 2 }, { r: 4, c: 5 }, { r: 5, c: 2 },
      { r: 5, c: 5 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 5 }
    ]
  },

  {
    level: 3,
    title: "Highland Sanctuary",
    subtitle: "A massive pack of 7 wolves! Place 7 sheep, 7 wolves, and 14 grass for 25 weeks.",
    gridSize: 9,
    targetWeeks: 25,
    maxSheep: 16,
    grassRegrowTime: 3,
    description: "7 wolves roam the vast highland sanctuary! Place 7 sheep, 7 wolves, and 14 grass patches. Balance the rapid predator-prey dynamics for 25 weeks.",
    tip: "💡 Sheep breed quickly when well-fed. Rotate pastures so wolves always have a meal without wiping out your breeders.",
    inventory: {
      sheep: 7,
      wolves: 7,
      grass: 14
    },
    preset: {
      sheepPositions: [
        { r: 4, c: 2, energy: 4 },
        { r: 4, c: 3, energy: 4 },
        { r: 4, c: 4, energy: 4 },
        { r: 4, c: 5, energy: 4 },
        { r: 4, c: 6, energy: 4 },
        { r: 5, c: 3, energy: 4 },
        { r: 5, c: 5, energy: 4 }
      ],
      wolfPositions: [
        { r: 1, c: 1, hunger: 0 },
        { r: 1, c: 7, hunger: 1 },
        { r: 7, c: 1, hunger: 0 },
        { r: 7, c: 7, hunger: 1 },
        { r: 2, c: 4, hunger: 0 },
        { r: 6, c: 4, hunger: 2 },
        { r: 4, c: 8, hunger: 0 }
      ],
      grassPositions: [
        { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 5 }, { r: 3, c: 6 },
        { r: 4, c: 1 }, { r: 4, c: 7 }, { r: 5, c: 2 }, { r: 5, c: 4 },
        { r: 5, c: 6 }, { r: 6, c: 3 }, { r: 6, c: 5 }, { r: 2, c: 3 },
        { r: 2, c: 5 }, { r: 5, c: 1 }
      ]
    },
    sheepPositions: [
      { r: 4, c: 2, energy: 4 },
      { r: 4, c: 3, energy: 4 },
      { r: 4, c: 4, energy: 4 },
      { r: 4, c: 5, energy: 4 },
      { r: 4, c: 6, energy: 4 },
      { r: 5, c: 3, energy: 4 },
      { r: 5, c: 5, energy: 4 }
    ],
    wolfPositions: [
      { r: 1, c: 1, hunger: 0 },
      { r: 1, c: 7, hunger: 1 },
      { r: 7, c: 1, hunger: 0 },
      { r: 7, c: 7, hunger: 1 },
      { r: 2, c: 4, hunger: 0 },
      { r: 6, c: 4, hunger: 2 },
      { r: 4, c: 8, hunger: 0 }
    ],
    grassPositions: [
      { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 5 }, { r: 3, c: 6 },
      { r: 4, c: 1 }, { r: 4, c: 7 }, { r: 5, c: 2 }, { r: 5, c: 4 },
      { r: 5, c: 6 }, { r: 6, c: 3 }, { r: 6, c: 5 }, { r: 2, c: 3 },
      { r: 2, c: 5 }, { r: 5, c: 1 }
    ]
  },

  {
    level: 4,
    title: "The Narrow Glade",
    subtitle: "5x5 terrain, 8 sheep, 4 wolves, 16 grass. Survive 30 weeks for Score!",
    gridSize: 5,
    targetWeeks: 30,
    maxSheep: 12,
    grassRegrowTime: 3,
    isScoredLevel: true,
    description: "Compact 5x5 glade. Place 8 sheep, 4 wolves, and 16 grass patches. Survive for 30 weeks. Your score is the total number of surviving sheep!",
    tip: "💡 On compact grids, herd positioning is critical. Keep parents healthy and graze often.",
    inventory: {
      sheep: 8,
      wolves: 4,
      grass: 16
    },
    preset: {
      sheepPositions: [
        { r: 2, c: 1, energy: 4 },
        { r: 2, c: 2, energy: 4 },
        { r: 2, c: 3, energy: 4 },
        { r: 3, c: 1, energy: 4 },
        { r: 3, c: 2, energy: 4 },
        { r: 3, c: 3, energy: 4 },
        { r: 4, c: 1, energy: 4 },
        { r: 4, c: 2, energy: 4 }
      ],
      wolfPositions: [
        { r: 0, c: 0, hunger: 0 },
        { r: 0, c: 4, hunger: 1 },
        { r: 4, c: 4, hunger: 0 },
        { r: 4, c: 0, hunger: 1 }
      ],
      grassPositions: [
        { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 },
        { r: 2, c: 0 }, { r: 2, c: 4 },
        { r: 3, c: 0 }, { r: 3, c: 4 },
        { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 },
        { r: 4, c: 3 }, { r: 2, c: 2 }, { r: 3, c: 1 }, { r: 3, c: 3 }
      ]
    },
    sheepPositions: [
      { r: 2, c: 1, energy: 4 },
      { r: 2, c: 2, energy: 4 },
      { r: 2, c: 3, energy: 4 },
      { r: 3, c: 1, energy: 4 },
      { r: 3, c: 2, energy: 4 },
      { r: 3, c: 3, energy: 4 },
      { r: 4, c: 1, energy: 4 },
      { r: 4, c: 2, energy: 4 }
    ],
    wolfPositions: [
      { r: 0, c: 0, hunger: 0 },
      { r: 0, c: 4, hunger: 1 },
      { r: 4, c: 4, hunger: 0 },
      { r: 4, c: 0, hunger: 1 }
    ],
    grassPositions: [
      { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 },
      { r: 2, c: 0 }, { r: 2, c: 4 },
      { r: 3, c: 0 }, { r: 3, c: 4 },
      { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 },
      { r: 4, c: 3 }, { r: 2, c: 2 }, { r: 3, c: 1 }, { r: 3, c: 3 }
    ]
  },

  {
    level: 5,
    title: "Shadow Valley",
    subtitle: "5x5 terrain, 8 sheep, 5 wolves, 16 grass. Survive 30 weeks for Score!",
    gridSize: 5,
    targetWeeks: 30,
    maxSheep: 14,
    grassRegrowTime: 3,
    isScoredLevel: true,
    description: "5 wolves stalk the 5x5 shadow valley! Place 8 sheep, 5 wolves, and 16 grass patches. Survive for 30 weeks. Sheep surviving become your Level 5 score!",
    tip: "💡 Always maintain a continuous breeding pipeline so a replacement sheep is ready when the wolf hungers.",
    inventory: {
      sheep: 8,
      wolves: 5,
      grass: 16
    },
    preset: {
      sheepPositions: [
        { r: 2, c: 1, energy: 4 },
        { r: 2, c: 2, energy: 4 },
        { r: 2, c: 3, energy: 4 },
        { r: 3, c: 1, energy: 4 },
        { r: 3, c: 2, energy: 4 },
        { r: 3, c: 3, energy: 4 },
        { r: 4, c: 1, energy: 4 },
        { r: 4, c: 2, energy: 4 }
      ],
      wolfPositions: [
        { r: 0, c: 0, hunger: 0 },
        { r: 0, c: 4, hunger: 1 },
        { r: 4, c: 4, hunger: 0 },
        { r: 4, c: 0, hunger: 1 },
        { r: 0, c: 2, hunger: 2 }
      ],
      grassPositions: [
        { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 },
        { r: 2, c: 0 }, { r: 2, c: 4 },
        { r: 3, c: 0 }, { r: 3, c: 4 },
        { r: 0, c: 1 }, { r: 0, c: 3 },
        { r: 4, c: 3 }, { r: 2, c: 2 }, { r: 3, c: 1 }, { r: 3, c: 3 }, { r: 2, c: 3 }
      ]
    },
    sheepPositions: [
      { r: 2, c: 1, energy: 4 },
      { r: 2, c: 2, energy: 4 },
      { r: 2, c: 3, energy: 4 },
      { r: 3, c: 1, energy: 4 },
      { r: 3, c: 2, energy: 4 },
      { r: 3, c: 3, energy: 4 },
      { r: 4, c: 1, energy: 4 },
      { r: 4, c: 2, energy: 4 }
    ],
    wolfPositions: [
      { r: 0, c: 0, hunger: 0 },
      { r: 0, c: 4, hunger: 1 },
      { r: 4, c: 4, hunger: 0 },
      { r: 4, c: 0, hunger: 1 },
      { r: 0, c: 2, hunger: 2 }
    ],
    grassPositions: [
      { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 },
      { r: 2, c: 0 }, { r: 2, c: 4 },
      { r: 3, c: 0 }, { r: 3, c: 4 },
      { r: 0, c: 1 }, { r: 0, c: 3 },
      { r: 4, c: 3 }, { r: 2, c: 2 }, { r: 3, c: 1 }, { r: 3, c: 3 }, { r: 2, c: 3 }
    ]
  },

  {
    level: 6,
    title: "The Grand Equilibrium",
    subtitle: "5x5 master challenge. 8 sheep, 6 wolves, 16 grass. 30 weeks Championship!",
    gridSize: 5,
    targetWeeks: 30,
    maxSheep: 14,
    grassRegrowTime: 3,
    isScoredLevel: true,
    description: "The Grand Final trial! Place 8 sheep, 6 wolves, and 16 grass patches on the 5x5 meadow. Survive for 30 weeks. Get your Level 6 score and your Grand Championship Total across Levels 4, 5, and 6!",
    tip: "💡 Breed constantly and keep wolves' hunger separated so they don't starve on the same week!",
    inventory: {
      sheep: 8,
      wolves: 6,
      grass: 16
    },
    preset: {
      sheepPositions: [
        { r: 2, c: 1, energy: 4 },
        { r: 2, c: 2, energy: 4 },
        { r: 2, c: 3, energy: 4 },
        { r: 3, c: 1, energy: 4 },
        { r: 3, c: 2, energy: 4 },
        { r: 3, c: 3, energy: 4 },
        { r: 4, c: 1, energy: 4 },
        { r: 4, c: 2, energy: 4 }
      ],
      wolfPositions: [
        { r: 0, c: 0, hunger: 0 },
        { r: 0, c: 4, hunger: 1 },
        { r: 4, c: 4, hunger: 0 },
        { r: 4, c: 0, hunger: 1 },
        { r: 0, c: 2, hunger: 2 },
        { r: 2, c: 4, hunger: 0 }
      ],
      grassPositions: [
        { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 },
        { r: 2, c: 0 }, { r: 3, c: 0 }, { r: 3, c: 4 },
        { r: 0, c: 1 }, { r: 0, c: 3 },
        { r: 4, c: 3 }, { r: 2, c: 2 }, { r: 3, c: 1 }, { r: 3, c: 3 }, { r: 2, c: 3 }, { r: 4, c: 2 }
      ]
    },
    sheepPositions: [
      { r: 2, c: 1, energy: 4 },
      { r: 2, c: 2, energy: 4 },
      { r: 2, c: 3, energy: 4 },
      { r: 3, c: 1, energy: 4 },
      { r: 3, c: 2, energy: 4 },
      { r: 3, c: 3, energy: 4 },
      { r: 4, c: 1, energy: 4 },
      { r: 4, c: 2, energy: 4 }
    ],
    wolfPositions: [
      { r: 0, c: 0, hunger: 0 },
      { r: 0, c: 4, hunger: 1 },
      { r: 4, c: 4, hunger: 0 },
      { r: 4, c: 0, hunger: 1 },
      { r: 0, c: 2, hunger: 2 },
      { r: 2, c: 4, hunger: 0 }
    ],
    grassPositions: [
      { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 },
      { r: 2, c: 0 }, { r: 3, c: 0 }, { r: 3, c: 4 },
      { r: 0, c: 1 }, { r: 0, c: 3 },
      { r: 4, c: 3 }, { r: 2, c: 2 }, { r: 3, c: 1 }, { r: 3, c: 3 }, { r: 2, c: 3 }, { r: 4, c: 2 }
    ]
  }
];

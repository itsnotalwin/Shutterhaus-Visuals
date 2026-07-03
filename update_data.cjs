const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

// Services
content = content.replace(
  'detail: \'Intimate, raw, and character-driven outdoor and lifestyle portraits. Capturing genuine moments in natural environments.\'',
  'detail: \'Intimate, raw, and character-driven outdoor and lifestyle portraits, capturing genuine moments in natural environments.\''
);

content = content.replace(
  'detail: \'Timeless family photography honoring connection and legacy. Authentic, heartwarming group and candid shots.\'',
  'detail: \'Timeless family photography honoring connection and legacy — authentic, heartwarming group and candid shots.\''
);

content = content.replace(
  'detail: \'Documenting the joy and high-energy of your milestone celebrations with a cinematic, unobtrusive approach.\'',
  'detail: \'Documenting the joy and high energy of your milestone celebrations with a cinematic, unobtrusive approach.\''
);

// Portfolio

content = content.replace(
  'description: \'A cinematic capturing of a matric farewell dress, blending formal elegance with a modern editorial aesthetic.\'',
  'description: \'A cinematic capture of a matric farewell dress, blending formal elegance with a modern editorial aesthetic.\''
);

content = content.replace(
  'description: \'Raw, emotive boudoir portrait focusing on silhouette and dramatic lighting.\'',
  'description: \'A raw, emotive boudoir portrait focusing on silhouette and dramatic lighting.\''
);

content = content.replace(
  'description: \'A genuine, unposed moment shared between family members in an open natural field.\'',
  'description: \'A genuine, unposed moment shared between family members in an open, natural field.\''
);

content = content.replace(
  'description: \'A joyous, high-energy event coverage capturing authentic celebration.\'',
  'description: \'Joyous, high-energy event coverage capturing authentic celebration.\''
);

fs.writeFileSync('src/data.ts', content);

const bcrypt = require('bcrypt');

bcrypt.hash('studentpass', 10).then(hashed => {
  console.log('Student password hash:', hashed);
});

bcrypt.hash('adminpass', 10).then(hashed => {
  console.log('Admin password hash:', hashed);
});

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

const properties = require('./json/properties.json');
const users = require('./json/users.json');


/// Users
// all user password = 'password';

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithEmail = function(email) {
//   let user;
//   for (const userId in users) {
//     user = users[userId];
//     if (user.email.toLowerCase() === email.toLowerCase()) {
//       break;
//     } else {
//       user = null;
//     }
//   }
//   console.log(user);
//   return Promise.resolve(user);
// }
// --------------------------------------------------------
const getUserWithEmail = function(email) { 
  
  return pool
    .query(`SELECT * FROM users;`, [])
    .then(res => {
      let user = null;
      
      for (const userProp of res.rows) {
        if (userProp.email.toLowerCase() === email.toLowerCase()) {
          user = userProp;
          break;
        }
      }
      return user;
    })
    .catch((err) => err.message);
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
// const getUserWithId = function(id) {
//   return Promise.resolve(users[id]);
// }
// --------------------------------------------------------------
const getUserWithId = function(id) {

  return pool
  .query(`SELECT * FROM users;`, [])
  .then(res => {
    let userID = null;
    
    for (const userProp of res.rows) {
      if (userProp.id === id) {
        userID = userProp;
        break;
      }
    }
    return userID;
  })
  .catch((err) => err.message);
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
// const addUser =  function(user) {
  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
// }
// ------------------------------------------------------------------
const addUser = function(user) {

  return pool
    .query(`
    INSERT INTO users (name, email, password) 
    VALUES ($1, $2, $3)
    RETURNING *;
    `, [user.name, user.email, user.password])
    .catch((err) => err.message)
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
// const getAllReservations = function(guest_id, limit = 10) {
  // return getAllProperties(null, 2);
// }
// -----------------------------------------------------------------
const getAllReservations = function(guest_id, limit = 10) {
  
  return pool
    .query(`
    SELECT thumbnail_photo_url,properties.id,title,start_date, end_date,cost_per_night,number_of_bathrooms,number_of_bedrooms,parking_spaces, avg(rating)::NUMERIC as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    AND reservations.end_date < now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2
    `, [guest_id, limit])
    .then((res) => {
        console.log(res);
        return res.rows;
      })
    .catch((err) => err.message);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
// const getAllProperties = function(options, limit = 10) {
//   const limitedProperties = {};
//   for (let i = 1; i <= limit; i++) {
//     limitedProperties[i] = properties[i];
//   }
//   console.log(limitedProperties);
//   return Promise.resolve(limitedProperties);
// }
// -----------------------------------------------------------------
// const getAllProperties = (options, limit = 10) => {
//   const queryString = `SELECT * FROM properties LIMIT $1;`

//   return pool
//     .query(
//       queryString,
//       [limit])
//       .then((result) => {
//         return result.rows;
//       })
//     .catch((err) => err.message);
//   };
  
// ------------------------------------------------------------------
const getAllProperties = function (options, limit = 10) {
  console.log(options);
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE true 
  `;
  
  // 3
  // if city is selected, return properties belonging to that city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` AND city LIKE $${queryParams.length}`;
  }

  // if an owner_id is passed in, only return properties belonging to that owner
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += ` AND owner_id = $${queryParams.length}`;
  }
  // if a minimum_price_per_night and a maximum_price_per_night, return properties price range.
  if (options.minimum_price_per_night && options.maximum_price_per_night) {

    queryParams.push(`${options.minimum_price_per_night}`);
    queryParams.push(`${options.maximum_price_per_night}`);

    queryString += ` AND cost_per_night BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;
  }

  queryString += ` GROUP BY properties.id`

  // if a minimum_rating is passed in, return properties with a rating equal to or higher
  if (options.minimum_rating) {

    queryParams.push(`${options.minimum_rating}`);
    queryString += ` HAVING avg(property_reviews.rating) >= $${queryParams.length}`;

  }

  queryParams.push(limit);
  queryString += ` ORDER BY cost_per_night LIMIT $${queryParams.length};`;
  
  // 4
  console.log('queryString \n\n', queryString);
  console.log('===========================================');
  console.log('queryParams \n\n', queryParams);
  console.log('===========================================');
  console.log('limit \n\n', limit);
  console.log('===========================================');

  // 5
  return pool.query(queryString, queryParams).then((res) => res.rows);
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;

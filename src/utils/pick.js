/**
 * Creates an object composed of the picked object properties.
 * This utility helps prevent mass assignment vulnerabilities by only allowing whitelisted fields.
 * @param {Object} object - The source object to pick properties from.
 * @param {string[]} keys - An array of property names to pick.
 * @returns {Object} - The new object with picked properties.
 */
const pick = (object, keys) => {
    return keys.reduce((obj, key) => {
      // Check if the key exists in the source object and the source object itself is not null/undefined.
      if (object && Object.prototype.hasOwnProperty.call(object, key)) {
        // Assign the value to the new object.
        obj[key] = object[key];
      }
      return obj;
    }, {});
  };
  
  export default pick;
  
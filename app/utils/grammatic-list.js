
export default function grammaticList(input, options = {}) {

  // Set and override default values
  const defaults = {
    period: true,
    delimiter: ',',
  };

  Object.keys(options).forEach(key => {
    defaults[key] = options[key];
  });


  if (typeof input === 'string') {
    input = input.split(defaults.delimiter);
  }

  if (input.length !== 1) {
    input.pop(); // Remove trailing comma
    let lastComparison = input.pop() + ((defaults.period) ? '.':'');

    if (input.length !== 0) {
      lastComparison = ` and ${lastComparison}`;
    }

    if (input.length === 1) {
      lastComparison = `${input.pop()}${lastComparison}`;
    }

    input.push(lastComparison);
  }

  return input.join(',');
}
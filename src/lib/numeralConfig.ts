import numeral from 'numeral';

// Register 'upper' locale for K, M, B, T abbreviations
if (!numeral.locales['upper']) {
  numeral.register('locale', 'upper', {
    delimiters: {
      thousands: ',',
      decimal: '.'
    },
    abbreviations: {
      thousand: 'K',
      million: 'M',
      billion: 'B',
      trillion: 'T'
    },
    ordinal: function (number) {
      return number === 1 ? 'st' : 'th';
    },
    currency: {
      symbol: '$'
    }
  });
}
numeral.locale('upper'); 
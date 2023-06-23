const moment = require('moment/moment');

function getStewardingAgency(fundingArray, uploads, agencyInfo) {
  const agenciesStewardingHOME = ['Georgia Department of Community Affairs', 'City of Atlanta'];

  const strArray = [];
  const fundingSource = fundingArray[0] || null;

  if (
    agencyInfo
      .filter(obj => obj.uploads.includes(uploads[0]))
      .map(obj => obj.name)
      .includes('Invest Atlanta')
  ) {
    strArray.push('Invest Atlanta');
  }
  if (fundingSource.includes('LIHTC')) {
    strArray.push('Georgia Department of Community Affairs');
  }
  if (fundingSource.includes('HomeFlex')) {
    strArray.push('Atlanta Housing');
  }
  if (fundingSource.includes('HOME')) {
    const upload = uploads[0];
    let agencyName = 'n/a';
    agencyInfo.forEach(obj =>
      obj.uploads.forEach(uploadID => {
        if (upload === uploadID) agencyName = obj.name;
      })
    );

    strArray.push(agenciesStewardingHOME.includes(agencyName) ? agencyName : 'n/a');
  }
  if (fundingSource.includes('Section 202') || fundingSource.includes('Section 8')) {
    strArray.push('Housing and Urban Development');
  }
  if (fundingSource.includes('Public Housing') || fundingSource.includes('AH Subsidy')) {
    strArray.push('Atlanta Housing');
  }

  if (strArray[0]) {
    if (strArray.length === 1) {
      return strArray[0];
    }
    if (strArray.length >= 2) {
      return strArray.join(', ');
    }
    // if (strArray.length > 2) {
    //   return `${strArray.filter((str, i) => i < strArray.length - 1).join(', ')} & ${strArray[strArray.length -1]}`
    // }
  }

  return 'n/a';
}

function calRisk(endDate, extendUseStartDate) {
  if (!endDate) {
    return 'n/a';
  }

  if (extendUseStartDate) {
    const now = new Date();
    const then = new Date(extendUseStartDate);

    const timeDiff = then.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30) % 12;
    const years = Math.floor(days / 365);

    if (!isNaN(days)) {
      const string = `${years} year${years !== 1 ? 's' : ''}, ${months} month${
        months !== 1 ? 's' : ''
      }`;
      return string;
    } else {
      return 'n/a';
    }
  }

  if (endDate) {
    const now = new Date();
    const then = new Date(endDate);

    const timeDiff = then.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30) % 12;
    const years = Math.floor(days / 365);

    if (!isNaN(days)) {
      const string = `${years} year${years !== 1 ? 's' : ''}, ${months} month${
        months !== 1 ? 's' : ''
      }`;
      return string;
    } else {
      return 'n/a';
    }
  }

  return 'n/a';
}

function formatAsProperName(text) {
  if (text) {
    const allLowerList = ['and', 'of', 'by', 'for', 'at', 'the', 'on', 'fka'];
    const allUpperList = ['ii', 'iii', 'iv', 'vi', 'vii', 'llc', 'inc', 'mlk'];
    return text
      .toLowerCase()
      .split(' ')
      .map((str, i) =>
        allLowerList.includes(str) && i > 0
          ? str
          : allUpperList.includes(str)
          ? str.toUpperCase()
          : str.charAt(0).toUpperCase() + str.substring(1)
      )
      .join(' ');
  }
  return 'n/a';
}

// Uses MongoDB Aggregation Pipeline syntax
function formatDateInMongoAggregation(dateField) {
  return {
    $let: {
      vars: {
        formattedDate: {
          $dateToString: {
            date: { $toDate: dateField },
            format: '%m/%d/%Y'
          }
        }
      },
      in: {
        $concat: [
          {
            $cond: [
              { $eq: [{ $substr: ['$$formattedDate', 0, 1] }, '0'] },
              { $substr: ['$$formattedDate', 1, { $strLenCP: '$$formattedDate' }] },
              '$$formattedDate'
            ]
          }
        ]
      }
    }
  };
}

module.exports = { formatAsProperName, formatDateInMongoAggregation, getStewardingAgency, calRisk };

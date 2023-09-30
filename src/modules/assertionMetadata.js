function getAssertionSizeInBytes(assertion) {
    const jsonString = JSON.stringify(assertion);
    const encoder = new TextEncoder();
    const encodedBytes = encoder.encode(jsonString);
    return encodedBytes.length;
  }
  
function getAssertionTriplesNumber(assertion) {
return assertion.length;
}

function getAssertionChunksNumber(assertion) {
return assertion.length;
}

module.exports = {
getAssertionSizeInBytes,
getAssertionTriplesNumber,
getAssertionChunksNumber,
}
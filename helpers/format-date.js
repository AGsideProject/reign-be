function formatDate(isoDate) {
  const date = new Date(isoDate);

  const day = date.getDate().toString().padStart(2, "0"); // Ensure 2-digit day
  const month = date.toLocaleString("default", { month: "short" }); // Get short month name
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

module.exports = formatDate;

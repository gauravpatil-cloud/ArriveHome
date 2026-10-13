const sampleListings = [
{
title: "Cozy Beachfront Cottage",
description: "Escape to this charming beachfront cottage for a relaxing getaway. Enjoy stunning ocean views and easy access to the beach.",
image: {
    url: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 1500,
location: "Malibu",
country: "United States",
},
{
title: "Modern Loft in Downtown",
description: "Stay in the heart of the city in this stylish loft apartment. Perfect for urban explorers!",
image: {
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 1200,
location: "New York City",
country: "United States",
},
{
title: "Mountain Retreat",
description: "Unplug and unwind in this peaceful mountain cabin. Surrounded by nature, it's a perfect place to recharge.",
image: {
    url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 1000,
location: "Aspen",
country: "United States",
},
{
title: "Historic Villa in Tuscany",
description: "Experience the charm of Tuscany in this beautifully restored villa. Explore the rolling hills and vineyards.",
image: {
    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 2500,
location: "Florence",
country: "Italy",
},
{
title: "Secluded Treehouse Getaway",
description: "Live among the treetops in this unique treehouse retreat. A true nature lover's paradise.",
image: {
    url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 800,
location: "Portland",
country: "United States",
},
{
title: "Beachfront Paradise",
description: "Step out of your door onto the sandy beach. This beachfront condo offers the ultimate relaxation.",
image: {
    url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 2000,
location: "Cancun",
country: "Mexico",
},
{
title: "Rustic Cabin by the Lake",
description: "Spend your days fishing and kayaking on the serene lake. This cozy cabin is perfect for outdoor enthusiasts.",
image: {
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 900,
location: "Lake Tahoe",
country: "United States",
},
{
title: "Luxury Penthouse with City Views",
description: "Indulge in luxury living with panoramic city views from this stunning penthouse apartment.",
image: {
    url: "https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 3500,
location: "Los Angeles",
country: "United States",
},
{
title: "Ski-In/Ski-Out Chalet",
description: "Hit the slopes right from your doorstep in this ski-in/ski-out chalet in the Swiss Alps.",
image: {
    url: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 3000,
location: "Verbier",
country: "Switzerland",
},
{
title: "Safari Lodge in the Serengeti",
description: "Experience the thrill of the wild in a comfortable safari lodge. Witness the Great Migration up close.",
image: {
    url: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 4000,
location: "Serengeti National Park",
country: "Tanzania",
},
{
title: "Historic Canal House",
description: "Stay in a piece of history in this beautifully preserved canal house in Amsterdam's iconic district.",
image: {
    url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 1800,
location: "Amsterdam",
country: "Netherlands",
},
{
title: "Private Island Retreat",
description: "Have an entire island to yourself for a truly exclusive and unforgettable vacation experience.",
image: {
    url: "https://images.unsplash.com/photo-1618140052121-39fc6db33972?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 10000,
location: "Fiji",
country: "Fiji",
},
{
title: "Charming Cottage in the Cotswolds",
description: "Escape to the picturesque Cotswolds in this quaint and charming cottage with a thatched roof.",
image: {
    url: "https://images.unsplash.com/photo-1602088113235-229c19758e9f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 1200,
location: "Cotswolds",
country: "United Kingdom",
},
{
title: "Historic Brownstone in Boston",
description: "Step back in time in this elegant historic brownstone located in the heart of Boston.",
image: {
    url: "https://images.unsplash.com/photo-1533619239233-6280475a633a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 2200,
location: "Boston",
country: "United States",
},
{
title: "Beachfront Bungalow in Bali",
description: "Relax on the sandy shores of Bali in this beautiful beachfront bungalow with a private pool.",
image: {
    url: "https://images.unsplash.com/photo-1602391833977-358a52198938?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 1800,
location: "Bali",
country: "Indonesia",
},
{
title: "Mountain View Cabin in Banff",
description: "Enjoy breathtaking mountain views from this cozy cabin in the Canadian Rockies.",
image: {
    url: "https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    filename: "listingimage"
},
price: 1500,
location: "Banff",
country: "Canada",
}
];
module.exports = sampleListings ;



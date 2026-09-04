import { useEffect, useMemo, useState } from "react";
import { getCollection, sendAuthRequest } from "./services/api";
import "./App.css";

const sampleEvents = [
  { id: "event-1", name: "Kandy Cultural Dance Show", location: "Kandy", category: "Cultural", date: "Every Friday", estimatedCost: 1000, emoji: "🎭" },
  { id: "event-2", name: "Esala Perahera", location: "Kandy", category: "Festival", date: "July / August", estimatedCost: 1000, emoji: "🎉" },
  { id: "event-3", name: "Poson Festival", location: "Anuradhapura", category: "Religious", date: "June", estimatedCost: 0, emoji: "🪔" },
];

function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("lankaUser") || "null"));
  const [places, setPlaces] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tripItems, setTripItems] = useState([]);
  const [transportCost, setTransportCost] = useState(0);
  const [placeSearch, setPlaceSearch] = useState("");
  const [placeCity, setPlaceCity] = useState("All");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [placeData, hotelData] = await Promise.all([getCollection("places"), getCollection("hotels")]);
        setPlaces(placeData);
        setHotels(hotelData);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const goTo = (nextPage) => { setNotice(""); setPage(nextPage); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const visiblePlaces = useMemo(() => places.filter((place) => (placeCity === "All" || place.location === placeCity) && place.name.toLowerCase().includes(placeSearch.toLowerCase())), [places, placeCity, placeSearch]);
  const total = tripItems.reduce((sum, item) => sum + item.price * item.nights, 0) + Number(transportCost || 0);

  const addToTrip = (item, type) => {
    const id = item._id || item.id;
    if (tripItems.some((tripItem) => tripItem.id === id)) return setNotice(`${item.name} is already in My Trip.`);
    const price = type === "hotel" ? item.pricePerNight : item.estimatedCost;
    setTripItems([...tripItems, { id, name: item.name, type, price, nights: 1, emoji: type === "place" ? "📍" : type === "hotel" ? "🏨" : item.emoji }]);
    setNotice(`${item.name} was added to My Trip.`);
  };

  const handleAuth = async (event, action) => {
    event.preventDefault();
    try {
      const result = await sendAuthRequest(action, Object.fromEntries(new FormData(event.currentTarget).entries()));
      if (action === "register") { goTo("login"); setNotice("Registration successful. Please log in."); return; }
      localStorage.setItem("lankaToken", result.token);
      localStorage.setItem("lankaUser", JSON.stringify(result.user));
      setUser(result.user);
      goTo(result.user.role === "admin" ? "admin" : "places");
    } catch (authError) { setNotice(authError.message); }
  };

  const logout = () => { localStorage.removeItem("lankaToken"); localStorage.removeItem("lankaUser"); setUser(null); goTo("home"); };
  const heading = (eyebrow, title, copy) => <section className="page-heading"><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></section>;
  const Card = ({ item, type }) => {
    const city = item.location;
    const cost = type === "hotel" ? item.pricePerNight : item.estimatedCost;
    const emoji = type === "place" ? "📍" : type === "hotel" ? "🏨" : item.emoji;
    return <article className="card"><div className="card-icon">{emoji}</div><div className="card-content"><span className="tag">{city} · {item.category || type}</span><h3>{item.name}</h3><p>{type === "hotel" ? `★ ${item.rating ?? "New"} · Rs. ${Number(cost).toLocaleString()} / night` : type === "place" ? `Rs. ${Number(cost).toLocaleString()} · ${item.estimatedDuration} hours` : `${item.date} · Rs. ${Number(cost).toLocaleString()}`}</p><button className="text-button" onClick={() => addToTrip(item, type)}>+ Add to My Trip</button></div></article>;
  };

  const dataState = (items, emptyText) => loading ? <div className="empty-state"><h2>Loading information…</h2></div> : error ? <div className="empty-state"><h2>Could not load data</h2><p>{error}</p><button onClick={() => window.location.reload()}>Try again</button></div> : items.length ? <section className="card-grid">{items}</section> : <div className="empty-state"><h2>{emptyText}</h2><p>An admin can add content through the API.</p></div>;

  const content = () => {
    if (page === "places") return <main className="page">{heading("EXPLORE", "Places to visit", "Live place data from the LankaExplore backend.")}<section className="filters"><input value={placeSearch} onChange={(event) => setPlaceSearch(event.target.value)} placeholder="Search places" /><select value={placeCity} onChange={(event) => setPlaceCity(event.target.value)}><option>All</option><option>Kandy</option><option>Anuradhapura</option></select></section>{dataState(visiblePlaces.map((place) => <Card key={place._id} item={place} type="place" />), "No places match your search.")}</main>;
    if (page === "hotels") return <main className="page">{heading("STAY", "Hotels", "Live hotel data from the LankaExplore backend.")}{dataState(hotels.map((hotel) => <Card key={hotel._id} item={hotel} type="hotel" />), "No hotels have been added yet.")}</main>;
    if (page === "events") return <main className="page">{heading("WHAT'S ON", "Events", "Date filtering will connect when the Events API is ready.")}<section className="date-panel"><label>Visiting from<input type="date" /></label><label>Visiting to<input type="date" /></label><button onClick={() => setNotice("The Event API is the next backend feature to connect.")}>Find events</button></section><section className="card-grid">{sampleEvents.map((event) => <Card key={event.id} item={event} type="event" />)}</section></main>;
    if (page === "trip") return <main className="page">{heading("YOUR PLAN", "My Trip", "Local planning preview until the Trip API is ready.")}<section className="trip-layout"><div className="trip-list">{tripItems.length === 0 ? <div className="empty-state"><div>🧳</div><h2>Your trip is empty</h2><p>Add a place, hotel, or event to start planning.</p><button onClick={() => goTo("places")}>Explore places</button></div> : tripItems.map((item) => <div className="trip-item" key={item.id}><div><strong>{item.emoji} {item.name}</strong><span>{item.type} · Rs. {(item.price * item.nights).toLocaleString()}</span></div>{item.type === "hotel" && <label>Nights <input type="number" min="1" value={item.nights} onChange={(event) => setTripItems(tripItems.map((tripItem) => tripItem.id === item.id ? { ...tripItem, nights: Number(event.target.value) } : tripItem))} /></label>}<button className="remove" onClick={() => setTripItems(tripItems.filter((tripItem) => tripItem.id !== item.id))}>Remove</button></div>)}</div><aside className="cost-card"><h2>Estimated cost</h2><label>Transportation cost (Rs.)<input type="number" min="0" value={transportCost} onChange={(event) => setTransportCost(event.target.value)} /></label><div className="total"><span>Total estimate</span><strong>Rs. {total.toLocaleString()}</strong></div><small>This is an estimate only. LankaExplore does not process bookings or payments.</small></aside></section></main>;
    if (page === "login" || page === "register") { const isLogin = page === "login"; return <main className="auth-page"><form className="auth-card" onSubmit={(event) => handleAuth(event, isLogin ? "login" : "register")}><span>{isLogin ? "WELCOME BACK" : "CREATE ACCOUNT"}</span><h1>{isLogin ? "Log in to LankaExplore" : "Start planning your trip"}</h1><p>{isLogin ? "Use your account to manage your personal trip." : "Create a free tourist account in a few seconds."}</p>{!isLogin && <label>Full name<input name="name" required placeholder="Your name" /></label>}<label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" required placeholder="Your password" /></label><button type="submit">{isLogin ? "Log in" : "Create account"}</button><p className="auth-switch">{isLogin ? "New to LankaExplore?" : "Already have an account?"} <button type="button" className="link-button" onClick={() => goTo(isLogin ? "register" : "login")}>{isLogin ? "Register" : "Log in"}</button></p></form></main>; }
    if (page === "admin") return <main className="page">{heading("ADMIN AREA", "Dashboard", "Manage the tourism information shown to visitors.")}{user?.role === "admin" ? <section className="admin-grid"><div className="stat-card"><strong>{places.length}</strong><span>Places</span><button>Manage places</button></div><div className="stat-card"><strong>{hotels.length}</strong><span>Hotels</span><button>Manage hotels</button></div><div className="stat-card"><strong>—</strong><span>Events</span><button>Manage events</button></div></section> : <div className="empty-state"><div>🔒</div><h2>Admin access required</h2><p>Please log in with an admin account.</p><button onClick={() => goTo("login")}>Log in</button></div>}</main>;
    return <main><section className="hero-section"><div><span className="eyebrow">PLAN SRI LANKA, SIMPLY</span><h1>Discover more. <em>Plan better.</em></h1><p>LankaExplore helps visitors find places, hotels, and events in Kandy and Anuradhapura.</p><div className="hero-actions"><button onClick={() => goTo("places")}>Explore places</button><button className="outline" onClick={() => goTo("events")}>Find events</button></div></div><div className="hero-visual"><div className="sun">☀️</div><div className="landmark">🛕</div><div className="location-card">📍 <b>Kandy & Anuradhapura</b><small>Two unforgettable destinations</small></div></div></section><section className="feature-section"><div className="section-intro"><span>HOW IT WORKS</span><h2>Your trip, in three easy steps.</h2></div><div className="steps"><div><b>01</b><h3>Explore</h3><p>Browse attractions, hotels, and local events.</p></div><div><b>02</b><h3>Build your trip</h3><p>Add the things that interest you to your plan.</p></div><div><b>03</b><h3>Estimate costs</h3><p>See a simple total before you travel.</p></div></div></section></main>;
  };

  return <div className="app-shell"><header><button className="brand" onClick={() => goTo("home")}>Lanka<span>Explore</span></button><nav><button onClick={() => goTo("places")}>Places</button><button onClick={() => goTo("hotels")}>Hotels</button><button onClick={() => goTo("events")}>Events</button><button onClick={() => goTo("trip")}>My Trip <span className="trip-count">{tripItems.length}</span></button></nav><div className="account-actions">{user ? <><button className="user-name" onClick={() => goTo(user.role === "admin" ? "admin" : "trip")}>Hi, {user.name.split(" ")[0]}</button><button className="logout" onClick={logout}>Log out</button></> : <><button className="login" onClick={() => goTo("login")}>Log in</button><button className="register" onClick={() => goTo("register")}>Register</button></>}</div></header>{notice && <div className="notice">{notice}<button onClick={() => setNotice("")}>×</button></div>}{content()}<footer><b>LankaExplore</b><span>Plan your Kandy and Anuradhapura journey with confidence.</span></footer></div>;
}

export default App;

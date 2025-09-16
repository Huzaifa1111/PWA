export default function ItemCard({ name, price, onBought, onSold }) {
  return (
    <div className="border p-4 rounded shadow">
      <h3 className="text-lg font-bold">{name}</h3>
      <p>Price: ${price}</p>
      <button onClick={onBought} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Bought</button>
      <button onClick={onSold} className="bg-green-500 text-white px-2 py-1 rounded">Sold</button>
    </div>
  );
}
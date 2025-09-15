export default function ItemCard({ name, price, onAdd }) {
  return (
    <div className="border p-4 rounded shadow">
      <h3 className="text-lg font-bold">{name}</h3>
      <p>Price: ${price}</p>
      <button onClick={onAdd} className="bg-green-500 text-white px-2 py-1 rounded">Add to Sale</button>
    </div>
  );
}
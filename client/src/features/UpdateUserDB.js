export default async function updateUserDB({ userData }) {
    const updatedUser = userData;
    const id = updatedUser._id;

    await fetch(`http://localhost:5000/update/${id}`, {
        method: "POST",
        body: JSON.stringify(updatedUser),
        headers: {
            'Content-Type': 'application/json'
        },
    });
}
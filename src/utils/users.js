const users = [];

const addUser = ({ id, username, room }) => {
  // 處理字串
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // 確認字串不為空
  if (!username || !room) {
    return { error: "User name or room should not be empty." };
  }

  // 確認沒有重複的名字
  const existingUser = users.find((user) => {
    return user.username === username && user.room === room;
    // 會返回物件
  });

  if (existingUser) {
    return { error: "User name should be unique." };
  }

  // 都沒問題，就把user加到array中
  const user = { id, username, room };
  users.push(user);
  return { user }; // 最後正確的話就return user object,錯誤的話就return error。
  // 注意：要加上大括號，因為他要是一個物件，在join的時候才方便提取
};

const removeUser = (id) => {
  const userIndex = users.findIndex((user) => {
    return user.id === id;
  });

  if (userIndex === -1) {
    return { error: "User is not found." };
  }

  return users.splice(userIndex, 1)[0]; // splice會return被刪除掉的物件，所以還可以用[i]取得
};

const getUser = (id) => {
  return users.find((user) => {
    return user.id === id;
  });
};

const getUsersInRoom = (room) => {
  room = room.trim().toLowerCase(); // 可加可不加，因為使用者實際上不會遇到這個問題

  return users.filter((user) => {
    return user.room === room;
  });
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};

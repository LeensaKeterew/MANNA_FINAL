import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import CreatePost from "../components/CreatePost";
import "./CreatePostPage.css";

export default function CreatePostPage() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <NavBar />
      <div className="app-body">
        <main className="create-post-panel">
          <CreatePost
            onCreated={(post) => navigate(`/post/${post.id}`)}
            onCancel={() => navigate("/home")}
          />
        </main>
      </div>
    </div>
  );
}

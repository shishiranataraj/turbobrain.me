import { Link } from "react-router-dom";
import Penguin from "../components/Penguin";

export default function Landing() {
  return (
    <div className="landing">
      <div className="hero">
        <div className="hero-text">
          <img src="/me.jpg" alt="Shishira Nataraj" className="avatar" />
          <h1>
            turbo<span className="accent">brain</span>.me
          </h1>
          <p className="tagline">Shishira Nataraj — Forward Deployed AI Engineer</p>
          <p className="subtitle">
            I'm driven by an innate curiosity about how things work — and a restlessness
            to make them work better. I build AI applications that unblock organisations,
            mostly in manufacturing and process optimisation. Sensor data, computer vision,
            full-stack delivery. I ship with coding agents and own the outcome end to end.
          </p>
          <p className="subtitle">
            I care deeply about clear communication — technically precise but never
            inaccessible. I also have a knack for analogies: the kind that make a
            complex idea suddenly obvious. Whether writing code, a design doc, or
            explaining a model's behaviour to a non-technical stakeholder, I think
            the clearest explanation is usually the most honest one.
          </p>
          <p className="subtitle">
            When I'm not vibe coding, I'm listening to music, cooking, or slowly learning
            the bass guitar. I enjoy a good cup of coffee, sleeping in, and diving into
            new rabbit holes past midnight.
          </p>
          <div className="fun-facts">
            <span>Innately curious</span>
            <span>Manufacturing &amp; process AI</span>
            <span>Computer vision</span>
            <span>Clear communicator</span>
            <span>Bass guitar beginner</span>
            <span>Midnight rabbit holes</span>
          </div>
          <div className="hero-links">
            <Link to="/blog" className="btn">
              Read the blog
            </Link>
            <Link to="/projects" className="btn btn-secondary">
              See projects
            </Link>
          </div>
          <p className="connect-cta">
            Let's connect over{" "}
            <a href="mailto:shishira@turbobrain.me">mail</a>
            {" "}or a coffee.
          </p>
        </div>
        <div className="hero-mascot">
          <Penguin size={150} />
        </div>
      </div>
    </div>
  );
}

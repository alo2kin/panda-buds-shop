import { Battery, Bluetooth, Music, Volume2, Sparkles, Clock } from "lucide-react";

const benefits = [
  {
    icon: Music,
    title: "Kristalno čist zvuk",
    description: "Uživaj u svakom tonu sa premium drajverima za duboke basove i jasne visoke tonove.",
  },
  {
    icon: Bluetooth,
    title: "Bluetooth 5.3",
    description: "Najnovija Bluetooth tehnologija za stabilnu konekciju i minimalno kašnjenje.",
  },
  {
    icon: Battery,
    title: "Duga baterija",
    description: "Do 6 sati reprodukcije, plus dodatnih 24 sata sa kutijom za punjenje.",
  },
  {
    icon: Volume2,
    title: "Touch kontrole",
    description: "Intuitivne touch kontrole za upravljanje muzikom, pozivima i glasnoćom.",
  },
  {
    icon: Sparkles,
    title: "Jedinstven dizajn",
    description: "Prepoznatljiv panda dizajn koji te izdvaja od ostalih.",
  },
  {
    icon: Clock,
    title: "Brzo punjenje",
    description: "15 minuta punjenja za 2 sata slušanja. Nikad ne ostaneš bez muzike.",
  },
];

export const Benefits = () => {
  return (
    <section id="benefits" className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Zašto Panda Buds?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Više od običnih slušalica. Panda Buds kombinuju vrhunsku tehnologiju
            sa jedinstvenim stilom.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-bamboo/50 hover:shadow-md transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="h-14 w-14 rounded-xl bg-bamboo-light flex items-center justify-center mb-4 group-hover:bg-bamboo group-hover:scale-110 transition-all duration-300">
                <benefit.icon className="h-7 w-7 text-bamboo-dark group-hover:text-accent-foreground transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

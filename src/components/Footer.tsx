import { Mail, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🐼</span>
              <span className="text-xl font-bold">Panda Buds</span>
            </div>
            <p className="text-sm opacity-80">
              Bežične slušalice sa jedinstvenim panda dizajnom. Kvalitet,
              stil i udobnost u jednom paketu.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Brzi linkovi</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="#products" className="hover:opacity-100 transition-opacity">
                  Proizvodi
                </a>
              </li>
              <li>
                <a href="#benefits" className="hover:opacity-100 transition-opacity">
                  Benefiti
                </a>
              </li>
              <li>
                <a href="#warranty" className="hover:opacity-100 transition-opacity">
                  Garancija
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-3 text-sm opacity-80">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@panda-buds.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Srbija</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm opacity-60">
          <p>© {new Date().getFullYear()} Panda Buds. Sva prava zadržana.</p>
        </div>
      </div>
    </footer>
  );
};
